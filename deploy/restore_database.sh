#!/bin/bash

# ASL Holdem 데이터베이스 복원 스크립트
# 백업된 데이터베이스를 복원합니다.

set -e

# 설정
PROJECT_NAME="asl_holdem"
PROJECT_DIR="/var/www/$PROJECT_NAME"
BACKUP_DIR="/backup/$PROJECT_NAME"
DB_NAME="asl_db"
DB_USER="asl_user"

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 사용법 출력
usage() {
    echo "사용법: $0 [백업파일경로]"
    echo ""
    echo "예시:"
    echo "  $0 /backup/asl_holdem/database/asl_db_20250624_120000.sql.gz"
    echo "  $0 auto  # 가장 최근 백업 파일 자동 선택"
    echo ""
    echo "옵션:"
    echo "  -h, --help     이 도움말 출력"
    echo "  -l, --list     사용 가능한 백업 파일 목록 출력"
}

# 백업 파일 목록 출력
list_backups() {
    log_info "사용 가능한 백업 파일 목록:"
    echo ""
    
    if [ -d "$BACKUP_DIR/database" ]; then
        local backup_files=$(ls -t $BACKUP_DIR/database/*.sql.gz 2>/dev/null || true)
        if [ -n "$backup_files" ]; then
            echo "$backup_files" | while read -r file; do
                if [ -f "$file" ]; then
                    local size=$(du -h "$file" | cut -f1)
                    local date=$(stat -c %y "$file" | cut -d' ' -f1-2)
                    echo "  📁 $(basename "$file") (크기: $size, 날짜: $date)"
                fi
            done
        else
            log_warn "백업 파일을 찾을 수 없습니다."
        fi
    else
        log_error "백업 디렉토리가 존재하지 않습니다: $BACKUP_DIR/database"
    fi
}

# 가장 최근 백업 파일 찾기
find_latest_backup() {
    local latest_backup=$(ls -t $BACKUP_DIR/database/*.sql.gz 2>/dev/null | head -1)
    if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
        echo "$latest_backup"
    else
        return 1
    fi
}

# 데이터베이스 서비스 중지
stop_services() {
    log_step "관련 서비스 중지 중..."
    
    # Django 앱 중지
    sudo supervisorctl stop $PROJECT_NAME || log_warn "supervisorctl에서 $PROJECT_NAME 서비스를 찾을 수 없습니다."
    
    log_info "✅ 서비스 중지 완료"
}

# 데이터베이스 서비스 시작
start_services() {
    log_step "관련 서비스 시작 중..."
    
    # Django 앱 시작
    sudo supervisorctl start $PROJECT_NAME || log_warn "supervisorctl에서 $PROJECT_NAME 서비스를 찾을 수 없습니다."
    
    log_info "✅ 서비스 시작 완료"
}

# 데이터베이스 복원
restore_database() {
    local backup_file="$1"
    
    log_step "데이터베이스 복원 시작..."
    log_info "백업 파일: $backup_file"
    
    # 백업 파일 존재 확인
    if [ ! -f "$backup_file" ]; then
        log_error "백업 파일을 찾을 수 없습니다: $backup_file"
        return 1
    fi
    
    # 백업 파일 무결성 확인
    if ! gunzip -t "$backup_file"; then
        log_error "백업 파일이 손상되었습니다: $backup_file"
        return 1
    fi
    
    log_info "백업 파일 무결성 확인 완료"
    
    # 기존 데이터베이스 백업 (안전장치)
    log_info "기존 데이터베이스 임시 백업 중..."
    local temp_backup="/tmp/${DB_NAME}_before_restore_$(date +%Y%m%d_%H%M%S).sql"
    sudo -u postgres pg_dump $DB_NAME > $temp_backup || log_warn "기존 DB 백업 실패"
    
    # 데이터베이스 초기화
    log_info "데이터베이스 초기화 중..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
    
    # 백업 파일 복원
    log_info "백업 데이터 복원 중..."
    if gunzip -c "$backup_file" | sudo -u postgres psql -d $DB_NAME; then
        log_info "✅ 데이터베이스 복원 완료"
        
        # 임시 백업 파일 삭제
        rm -f $temp_backup
        
        # 권한 재설정
        log_info "데이터베이스 권한 재설정 중..."
        sudo -u postgres psql -d $DB_NAME << EOF
-- 데이터베이스 소유권 변경
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;

-- public 스키마에 대한 모든 권한 부여
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;

-- 미래에 생성될 객체에 대한 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;

-- PostgreSQL 15+ 버전 호환성을 위한 추가 권한
GRANT CREATE ON SCHEMA public TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;
EOF
        
        log_info "✅ 권한 설정 완료"
        
    else
        log_error "❌ 데이터베이스 복원 실패"
        
        # 실패 시 임시 백업으로 복구 시도
        if [ -f "$temp_backup" ]; then
            log_warn "임시 백업으로 복구 시도 중..."
            sudo -u postgres psql -d $DB_NAME < $temp_backup || log_error "복구도 실패했습니다."
            rm -f $temp_backup
        fi
        
        return 1
    fi
}

# 복원 후 검증
verify_restore() {
    log_step "복원 결과 검증 중..."
    
    # 데이터베이스 연결 테스트
    if sudo -u postgres psql -d $DB_NAME -c "SELECT version();" >/dev/null 2>&1; then
        log_info "✅ 데이터베이스 연결 확인"
    else
        log_error "❌ 데이터베이스 연결 실패"
        return 1
    fi
    
    # 테이블 수 확인
    local table_count=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    log_info "복원된 테이블 수: $table_count"
    
    # 주요 테이블 존재 확인
    local important_tables=("auth_user" "stores_store" "tournaments_tournament")
    for table in "${important_tables[@]}"; do
        if sudo -u postgres psql -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | xargs | grep -q 't'; then
            log_info "✅ 테이블 확인: $table"
        else
            log_warn "⚠️  테이블 누락: $table"
        fi
    done
}

# 메인 실행 함수
main() {
    local backup_file="$1"
    
    log_info "🚀 ASL Holdem 데이터베이스 복원 시작"
    
    # 인자 처리
    case "${backup_file:-}" in
        "auto")
            log_info "가장 최근 백업 파일을 자동으로 선택합니다..."
            if backup_file=$(find_latest_backup); then
                log_info "선택된 백업 파일: $backup_file"
            else
                log_error "사용 가능한 백업 파일을 찾을 수 없습니다."
                list_backups
                exit 1
            fi
            ;;
        "")
            log_error "백업 파일 경로를 지정해야 합니다."
            usage
            exit 1
            ;;
        *)
            # 지정된 파일 경로 사용
            ;;
    esac
    
    # 확인 메시지
    echo ""
    log_warn "⚠️  주의: 이 작업은 현재 데이터베이스를 완전히 교체합니다!"
    log_info "백업 파일: $backup_file"
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "복원이 취소되었습니다."
        exit 0
    fi
    
    # 복원 시작 시간 기록
    local start_time=$(date +%s)
    
    # 복원 수행
    stop_services
    restore_database "$backup_file"
    verify_restore
    start_services
    
    # 복원 완료 시간 계산
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "🎉 데이터베이스 복원 완료! 소요시간: ${duration}초"
    log_info "웹사이트를 확인해보세요: http://141.164.36.65"
}

# 인자 처리
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    -l|--list)
        list_backups
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac 