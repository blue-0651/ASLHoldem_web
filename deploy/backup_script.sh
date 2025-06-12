#!/bin/bash

# ASL Holdem 백업 스크립트
# 데이터베이스와 미디어 파일을 정기적으로 백업

set -e

# 설정
PROJECT_NAME="asl_holdem"
PROJECT_DIR="/var/www/$PROJECT_NAME"
BACKUP_DIR="/backup/$PROJECT_NAME"
DB_NAME="asl_db"
DB_USER="asl_user"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# 백업 디렉토리 생성
create_backup_dirs() {
    log_info "백업 디렉토리 생성 중..."
    sudo mkdir -p $BACKUP_DIR/{database,media,logs}
    sudo chown -R $(whoami):$(whoami) $BACKUP_DIR
}

# 데이터베이스 백업
backup_database() {
    log_info "데이터베이스 백업 시작..."
    
    local backup_file="$BACKUP_DIR/database/${DB_NAME}_${DATE}.sql"
    local backup_file_gz="$backup_file.gz"
    
    # PostgreSQL 백업
    if sudo -u postgres pg_dump $DB_NAME > $backup_file; then
        # 압축
        gzip $backup_file
        log_info "✅ 데이터베이스 백업 완료: $backup_file_gz"
        
        # 백업 파일 크기 확인
        local file_size=$(du -h $backup_file_gz | cut -f1)
        log_info "백업 파일 크기: $file_size"
    else
        log_error "❌ 데이터베이스 백업 실패"
        return 1
    fi
}

# 미디어 파일 백업
backup_media() {
    log_info "미디어 파일 백업 시작..."
    
    local media_backup="$BACKUP_DIR/media/media_${DATE}.tar.gz"
    
    if [ -d "$PROJECT_DIR/media" ] && [ "$(ls -A $PROJECT_DIR/media)" ]; then
        # 미디어 디렉토리가 존재하고 비어있지 않은 경우
        if tar -czf $media_backup -C $PROJECT_DIR media/; then
            log_info "✅ 미디어 파일 백업 완료: $media_backup"
            
            # 백업 파일 크기 확인
            local file_size=$(du -h $media_backup | cut -f1)
            log_info "미디어 백업 파일 크기: $file_size"
        else
            log_error "❌ 미디어 파일 백업 실패"
            return 1
        fi
    else
        log_warn "⚠️  미디어 파일이 없어 백업을 건너뜁니다."
    fi
}

# 로그 파일 백업
backup_logs() {
    log_info "로그 파일 백업 시작..."
    
    local logs_backup="$BACKUP_DIR/logs/logs_${DATE}.tar.gz"
    
    if [ -d "$PROJECT_DIR/logs" ] && [ "$(ls -A $PROJECT_DIR/logs)" ]; then
        if tar -czf $logs_backup -C $PROJECT_DIR logs/; then
            log_info "✅ 로그 파일 백업 완료: $logs_backup"
        else
            log_error "❌ 로그 파일 백업 실패"
            return 1
        fi
    else
        log_warn "⚠️  로그 파일이 없어 백업을 건너뜁니다."
    fi
}

# 오래된 백업 파일 정리
cleanup_old_backups() {
    log_info "오래된 백업 파일 정리 중..."
    
    # 30일 이전 파일 삭제
    find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete
    
    # 빈 디렉토리 삭제
    find $BACKUP_DIR -type d -empty -delete
    
    log_info "✅ $RETENTION_DAYS일 이전 백업 파일 정리 완료"
}

# 백업 상태 리포트
generate_report() {
    log_info "백업 리포트 생성 중..."
    
    local report_file="$BACKUP_DIR/backup_report_${DATE}.txt"
    
    cat > $report_file << EOF
ASL Holdem 백업 리포트
=====================
백업 날짜: $(date)
백업 위치: $BACKUP_DIR

백업 항목:
---------
EOF

    # 데이터베이스 백업 확인
    if ls $BACKUP_DIR/database/*${DATE}.sql.gz >/dev/null 2>&1; then
        echo "✅ 데이터베이스: 성공" >> $report_file
        local db_size=$(du -h $BACKUP_DIR/database/*${DATE}.sql.gz | cut -f1)
        echo "   크기: $db_size" >> $report_file
    else
        echo "❌ 데이터베이스: 실패" >> $report_file
    fi
    
    # 미디어 파일 백업 확인
    if ls $BACKUP_DIR/media/*${DATE}.tar.gz >/dev/null 2>&1; then
        echo "✅ 미디어 파일: 성공" >> $report_file
        local media_size=$(du -h $BACKUP_DIR/media/*${DATE}.tar.gz | cut -f1)
        echo "   크기: $media_size" >> $report_file
    else
        echo "⚠️  미디어 파일: 백업하지 않음" >> $report_file
    fi
    
    # 로그 파일 백업 확인
    if ls $BACKUP_DIR/logs/*${DATE}.tar.gz >/dev/null 2>&1; then
        echo "✅ 로그 파일: 성공" >> $report_file
    else
        echo "⚠️  로그 파일: 백업하지 않음" >> $report_file
    fi
    
    echo "" >> $report_file
    echo "디스크 사용량:" >> $report_file
    echo "-------------" >> $report_file
    du -sh $BACKUP_DIR/* >> $report_file
    
    log_info "✅ 백업 리포트 생성 완료: $report_file"
}

# 백업 무결성 확인
verify_backups() {
    log_info "백업 무결성 확인 중..."
    
    # 데이터베이스 백업 확인
    local db_backup=$(ls $BACKUP_DIR/database/*${DATE}.sql.gz 2>/dev/null | head -1)
    if [ -n "$db_backup" ]; then
        if gunzip -t "$db_backup"; then
            log_info "✅ 데이터베이스 백업 파일 무결성 확인됨"
        else
            log_error "❌ 데이터베이스 백업 파일 손상됨"
            return 1
        fi
    fi
    
    # 미디어 파일 백업 확인
    local media_backup=$(ls $BACKUP_DIR/media/*${DATE}.tar.gz 2>/dev/null | head -1)
    if [ -n "$media_backup" ]; then
        if tar -tzf "$media_backup" >/dev/null; then
            log_info "✅ 미디어 백업 파일 무결성 확인됨"
        else
            log_error "❌ 미디어 백업 파일 손상됨"
            return 1
        fi
    fi
}

# 메인 실행 함수
main() {
    log_info "🚀 ASL Holdem 백업 시작 - $DATE"
    
    # 백업 시작 시간 기록
    local start_time=$(date +%s)
    
    # 백업 수행
    create_backup_dirs
    backup_database
    backup_media
    backup_logs
    verify_backups
    cleanup_old_backups
    generate_report
    
    # 백업 완료 시간 계산
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "🎉 백업 완료! 소요시간: ${duration}초"
    
    # 백업 통계 출력
    log_info "📊 백업 통계:"
    log_info "- 총 백업 크기: $(du -sh $BACKUP_DIR | cut -f1)"
    log_info "- 백업 파일 수: $(find $BACKUP_DIR -type f | wc -l)"
}

# 사용법 출력
usage() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  -h, --help     이 도움말 출력"
    echo "  -d, --db-only  데이터베이스만 백업"
    echo "  -m, --media-only  미디어 파일만 백업"
    echo "  -v, --verify   기존 백업 파일 무결성 확인"
    echo ""
    echo "예시:"
    echo "  $0                 # 전체 백업"
    echo "  $0 --db-only       # 데이터베이스만 백업"
    echo "  $0 --verify        # 백업 파일 무결성 확인"
}

# 인자 처리
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    -d|--db-only)
        log_info "데이터베이스만 백업합니다."
        create_backup_dirs
        backup_database
        verify_backups
        ;;
    -m|--media-only)
        log_info "미디어 파일만 백업합니다."
        create_backup_dirs
        backup_media
        verify_backups
        ;;
    -v|--verify)
        log_info "백업 파일 무결성을 확인합니다."
        verify_backups
        ;;
    "")
        # 기본 실행 (전체 백업)
        main
        ;;
    *)
        log_error "알 수 없는 옵션: $1"
        usage
        exit 1
        ;;
esac 