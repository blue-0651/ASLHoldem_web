#!/bin/bash

# 사용자 역할 관리 기능 배포 스크립트
# ASL Holdem 웹 애플리케이션용

set -e  # 오류 발생 시 스크립트 중단

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️ [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️ [WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ [ERROR]${NC} $1"
}

# 배포 설정
PROJECT_DIR="/var/www/asl_holdem"
BACKEND_DIR="$PROJECT_DIR/backend"
VENV_PATH="$PROJECT_DIR/venv"

# 함수: 서버 환경 확인
check_environment() {
    log_info "서버 환경을 확인합니다..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "프로젝트 디렉토리가 존재하지 않습니다: $PROJECT_DIR"
        exit 1
    fi
    
    if [ ! -d "$VENV_PATH" ]; then
        log_error "가상 환경이 존재하지 않습니다: $VENV_PATH"
        exit 1
    fi
    
    log_success "서버 환경 확인 완료"
}

# 함수: 백업 생성
create_backup() {
    log_info "현재 상태를 백업합니다..."
    
    BACKUP_DIR="$PROJECT_DIR/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 주요 파일들 백업
    if [ -f "$BACKEND_DIR/accounts/admin.py" ]; then
        cp "$BACKEND_DIR/accounts/admin.py" "$BACKUP_DIR/"
    fi
    
    if [ -f "$BACKEND_DIR/asl_holdem/settings.py" ]; then
        cp "$BACKEND_DIR/asl_holdem/settings.py" "$BACKUP_DIR/"
    fi
    
    log_success "백업 완료: $BACKUP_DIR"
}

# 함수: Git에서 최신 코드 가져오기
update_code() {
    log_info "Git에서 최신 코드를 가져옵니다..."
    
    cd "$PROJECT_DIR"
    
    # 현재 브랜치 확인
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    log_info "현재 브랜치: $CURRENT_BRANCH"
    
    # 최신 코드 pull
    git fetch origin
    git pull origin "$CURRENT_BRANCH"
    
    log_success "코드 업데이트 완료"
}

# 함수: 파일 권한 설정
set_permissions() {
    log_info "파일 권한을 설정합니다..."
    
    # 새로 추가된 파일들의 권한 설정
    chmod 644 "$BACKEND_DIR/accounts/admin.py" 2>/dev/null || true
    chmod 644 "$BACKEND_DIR/accounts/signals.py" 2>/dev/null || true
    chmod 644 "$BACKEND_DIR/accounts/apps.py" 2>/dev/null || true
    chmod 644 "$BACKEND_DIR/accounts/management/commands/"*.py 2>/dev/null || true
    
    # 실행 권한이 필요한 파일들
    chmod +x "$BACKEND_DIR/manage.py" 2>/dev/null || true
    
    log_success "파일 권한 설정 완료"
}

# 함수: 가상환경 활성화 및 의존성 설치
setup_python_environment() {
    log_info "Python 가상환경을 활성화하고 의존성을 확인합니다..."
    
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    
    # requirements.txt가 있으면 의존성 업데이트
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt --quiet
        log_success "의존성 업데이트 완료"
    fi
}

# 함수: Django 설정 확인
check_django_settings() {
    log_info "Django 설정을 확인합니다..."
    
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    
    # settings.py에서 AccountsConfig 확인
    if grep -q "accounts.apps.AccountsConfig" asl_holdem/settings.py; then
        log_success "AccountsConfig 설정 확인됨"
    else
        log_warning "AccountsConfig가 설정되지 않았습니다. 수동으로 확인해주세요."
    fi
    
    # Django 설정 검증
    python manage.py check --quiet
    log_success "Django 설정 검증 완료"
}

# 함수: 데이터베이스 마이그레이션
run_migrations() {
    log_info "데이터베이스 마이그레이션을 실행합니다..."
    
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    
    # 마이그레이션 파일 생성
    python manage.py makemigrations accounts --noinput
    
    # 마이그레이션 실행
    python manage.py migrate --noinput
    
    log_success "데이터베이스 마이그레이션 완료"
}

# 함수: 정적 파일 수집
collect_static() {
    log_info "정적 파일을 수집합니다..."
    
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    
    python manage.py collectstatic --noinput --clear
    
    log_success "정적 파일 수집 완료"
}

# 함수: 사용자 권한 동기화
sync_user_permissions() {
    log_info "기존 사용자들의 권한을 동기화합니다..."
    
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    
    # 권한 동기화 실행
    python manage.py sync_user_permissions
    
    log_success "사용자 권한 동기화 완료"
}

# 함수: 서비스 재시작
restart_services() {
    log_info "서비스를 재시작합니다..."
    
    # Gunicorn 재시작
    if systemctl is-active --quiet gunicorn; then
        systemctl restart gunicorn
        log_success "Gunicorn 재시작 완료"
    else
        log_warning "Gunicorn 서비스가 실행 중이 아닙니다"
    fi
    
    # Nginx 재로드
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        log_success "Nginx 재로드 완료"
    else
        log_warning "Nginx 서비스가 실행 중이 아닙니다"
    fi
}

# 함수: 배포 검증
verify_deployment() {
    log_info "배포를 검증합니다..."
    
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    
    # Django 관리자 명령어들이 작동하는지 확인
    python manage.py check --quiet
    
    # 새로운 관리 명령어들 확인
    if python manage.py help | grep -q "sync_user_permissions"; then
        log_success "sync_user_permissions 명령어 사용 가능"
    else
        log_error "sync_user_permissions 명령어를 찾을 수 없습니다"
    fi
    
    if python manage.py help | grep -q "reset_all_passwords"; then
        log_success "reset_all_passwords 명령어 사용 가능"
    else
        log_error "reset_all_passwords 명령어를 찾을 수 없습니다"
    fi
    
    # 시그널이 제대로 로드되는지 확인
    python -c "
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()
from accounts.signals import sync_user_permissions_on_role_change
print('✅ 시그널이 성공적으로 로드되었습니다')
"
    
    log_success "배포 검증 완료"
}

# 메인 실행 함수
main() {
    echo "=================================================="
    echo "🚀 ASL Holdem 사용자 역할 관리 기능 배포 시작"
    echo "=================================================="
    echo ""
    
    # root 권한 확인
    if [ "$EUID" -ne 0 ]; then
        log_error "이 스크립트는 root 권한으로 실행해야 합니다"
        exit 1
    fi
    
    # 단계별 실행
    check_environment
    create_backup
    update_code
    set_permissions
    setup_python_environment
    check_django_settings
    run_migrations
    collect_static
    sync_user_permissions
    restart_services
    verify_deployment
    
    echo ""
    echo "=================================================="
    echo "🎉 배포 완료!"
    echo "=================================================="
    echo ""
    log_success "사용자 역할 관리 기능이 성공적으로 배포되었습니다"
    echo ""
    echo "📋 배포된 기능들:"
    echo "• 관리자 페이지에서 사용자 역할 수정 시 권한 자동 업데이트"
    echo "• 사용자 검색, 필터링, 일괄 관리 기능"
    echo "• 역할별 권한 자동 동기화 시그널"
    echo "• 비밀번호 관리 명령어들"
    echo "• 권한 동기화 명령어"
    echo ""
    echo "🔧 유용한 관리 명령어들:"
    echo "• python manage.py sync_user_permissions"
    echo "• python manage.py reset_all_passwords --confirm"
    echo "• python manage.py check_passwords"
    echo ""
}

# 스크립트 실행
main "$@" 