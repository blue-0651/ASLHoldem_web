#!/bin/bash

# 배포 서버 Git 업데이트 및 적용 스크립트
# 141.164.36.65 서버에서 실행

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 배포 서버 설정
DEPLOY_PATH="/var/www/asl_holdem"
BACKUP_DIR="/var/backups/asl_holdem"
CURRENT_TIME=$(date +"%Y%m%d_%H%M%S")

echo "======================================"
echo "ASL Holdem Git 업데이트 배포 스크립트"
echo "======================================"
echo "시작 시간: $(date)"
echo "배포 경로: $DEPLOY_PATH"
echo ""

# 1단계: 사전 검사
log_step "1. 사전 검사"

# 현재 디렉토리 확인
if [ ! -d "$DEPLOY_PATH" ]; then
    log_error "배포 디렉토리가 존재하지 않습니다: $DEPLOY_PATH"
    exit 1
fi

cd $DEPLOY_PATH
log_info "현재 작업 디렉토리: $(pwd)"

# Git 저장소 확인
if [ ! -d ".git" ]; then
    log_error "Git 저장소가 아닙니다. git clone이 필요합니다."
    exit 1
fi

# 인터넷 연결 확인
if ! ping -c 1 github.com &> /dev/null; then
    log_error "인터넷 연결을 확인할 수 없습니다."
    exit 1
fi

log_info "사전 검사 완료"

# 2단계: 백업 생성
log_step "2. 현재 상태 백업"

mkdir -p $BACKUP_DIR
if [ -d "backend" ]; then
    tar -czf "$BACKUP_DIR/backend_backup_$CURRENT_TIME.tar.gz" backend/
    log_info "백엔드 백업 완료: backend_backup_$CURRENT_TIME.tar.gz"
fi

if [ -d "frontend-v1" ]; then
    tar -czf "$BACKUP_DIR/frontend_backup_$CURRENT_TIME.tar.gz" frontend-v1/
    log_info "프론트엔드 백업 완료: frontend_backup_$CURRENT_TIME.tar.gz"
fi

# 3단계: Git 상태 확인
log_step "3. Git 상태 확인"

log_info "현재 브랜치: $(git branch --show-current)"
log_info "현재 커밋: $(git log --oneline -1)"

# 로컬 변경사항 확인
if [ -n "$(git status --porcelain)" ]; then
    log_warn "로컬에 변경사항이 있습니다:"
    git status --short
    echo ""
    read -p "변경사항을 무시하고 계속하시겠습니까? (y/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
        log_error "배포를 취소했습니다."
        exit 1
    fi
    
    # 로컬 변경사항 저장
    git stash push -m "배포 전 로컬 변경사항 저장 $CURRENT_TIME"
    log_info "로컬 변경사항을 stash에 저장했습니다."
fi

# 4단계: Git 업데이트
log_step "4. Git 업데이트"

log_info "원격 저장소에서 최신 변경사항 가져오는 중..."
git fetch origin

log_info "현재 커밋과 최신 커밋 비교:"
git log --oneline HEAD..origin/master | head -10

if [ -z "$(git log --oneline HEAD..origin/master)" ]; then
    log_info "이미 최신 상태입니다. 업데이트할 내용이 없습니다."
else
    log_info "업데이트 적용 중..."
    git pull origin master
    log_info "Git 업데이트 완료"
fi

# 5단계: 새로운 파일 및 권한 확인
log_step "5. 새로운 파일 및 권한 설정"

# 실행 권한 설정
find deploy/ -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
find . -name "*.sh" -maxdepth 1 -exec chmod +x {} \; 2>/dev/null || true

log_info "스크립트 실행 권한 설정 완료"

# 6단계: Django 설정 확인 및 적용
log_step "6. Django 설정 확인"

cd $DEPLOY_PATH/backend

# 가상환경 활성화
if [ -d ".venv" ]; then
    source .venv/bin/activate
    log_info "가상환경 활성화 완료"
else
    log_error "가상환경을 찾을 수 없습니다: .venv"
    exit 1
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    log_warn ".env 파일이 없습니다. 기본 설정으로 생성합니다."
    cat > .env << 'EOF'
DB_NAME=asl_db
DB_USER=asl_user
DB_PASSWORD=pppsss
DB_HOST=localhost
DB_PORT=5432
DEBUG=False
EOF
    log_info ".env 파일 생성 완료"
fi

# Django 설정 검증
log_info "Django 설정 검증 중..."
if python manage.py check; then
    log_info "Django 설정 검증 성공"
else
    log_error "Django 설정에 문제가 있습니다."
    exit 1
fi

# 7단계: 데이터베이스 마이그레이션
log_step "7. 데이터베이스 마이그레이션"

log_info "마이그레이션 파일 확인..."
if python manage.py showmigrations | grep -q "\[ \]"; then
    log_info "적용되지 않은 마이그레이션이 있습니다. 적용 중..."
    python manage.py migrate
    log_info "마이그레이션 적용 완료"
else
    log_info "모든 마이그레이션이 적용되어 있습니다."
fi

# 8단계: 새로운 관리 명령어 테스트
log_step "8. 새로운 관리 명령어 테스트"

# 새로 추가된 명령어들 확인
log_info "새로 추가된 관리 명령어들:"
python manage.py help | grep -E "(check_user_login|fix_user_login|sync_user_permissions|check_passwords|reset_all_passwords)" || log_warn "일부 명령어가 없을 수 있습니다."

# 간단한 테스트
log_info "DB 연결 테스트..."
python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT 1')
print('✓ Django DB 연결 성공!')
" || log_error "DB 연결 실패"

# 9단계: 웹 서비스 재시작
log_step "9. 웹 서비스 재시작"

# 실행 중인 Python 프로세스 종료
log_info "기존 Django 프로세스 종료 중..."
pkill -f "python.*manage.py" 2>/dev/null || true
pkill -f "gunicorn" 2>/dev/null || true
pkill -f "uwsgi" 2>/dev/null || true

sleep 2

# 서비스 재시작
log_info "웹 서비스 재시작 중..."

# 가능한 서비스들 재시작 시도
services=("gunicorn" "asl-holdem" "asl_holdem" "django" "uwsgi" "webapp")
service_restarted=false

for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        systemctl restart "$service"
        log_info "$service 서비스 재시작 완료"
        service_restarted=true
    fi
done

# Nginx 재시작
systemctl restart nginx
log_info "Nginx 재시작 완료"

# Frontend 빌드 (최신 소스코드 반영)
echo "🔨 프론트엔드 빌드 중..."
cd "$DEPLOY_PATH/frontend-v1"
if [ -f "package.json" ]; then
    echo "  - package.json 발견, npm 빌드 시작..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "  ✅ 프론트엔드 빌드 완료"
    else
        echo "  ❌ 프론트엔드 빌드 실패"
        read -p "계속 진행하시겠습니까? (y/N): " continue_anyway
        if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "  ⚠️ package.json이 없습니다. 프론트엔드 빌드를 건너뜁니다."
fi
cd "$DEPLOY_PATH"

if [ "$service_restarted" = false ]; then
    log_warn "재시작할 웹 서비스를 찾지 못했습니다. 수동으로 웹 서버를 시작해야 할 수 있습니다."
fi

# 10단계: 배포 완료 확인
log_step "10. 배포 완료 확인"

# 웹 서비스 상태 확인
log_info "웹 서비스 상태 확인:"
systemctl status nginx --no-pager -l || true

# 포트 사용 확인
log_info "웹 서버 포트 확인:"
netstat -tlnp | grep -E ":80|:8000|:8080" || log_warn "웹 서버 포트가 열려있지 않습니다."

# 최종 Git 상태
log_info "최종 Git 상태:"
git log --oneline -3

echo ""
echo "======================================"
echo "배포 완료!"
echo "======================================"
echo "완료 시간: $(date)"
echo "배포된 커밋: $(git log --oneline -1)"
echo ""
echo "확인 사항:"
echo "1. 웹사이트 접속: http://141.164.36.65/"
echo "2. 관리자 페이지: http://141.164.36.65/admin/"
echo "3. 새로운 관리 명령어들이 정상 작동하는지 확인"
echo ""
echo "문제가 발생한 경우 백업을 이용해 복원할 수 있습니다:"
echo "백업 위치: $BACKUP_DIR"
echo ""
echo "화이팅! 🚀" 