#!/bin/bash

# ASL Holdem 프로젝트 설정 스크립트
# vultr_deploy.sh 실행 후 프로젝트 파일 복사 후 실행

set -e

echo "🔧 ASL Holdem 프로젝트 설정 시작"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 변수 설정
PROJECT_NAME="asl_holdem"
PROJECT_DIR="/var/www/$PROJECT_NAME"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend-v1"

# 현재 사용자가 root인지 확인
if [[ $EUID -eq 0 ]]; then
   log_error "이 스크립트는 root 권한으로 실행하지 마세요!"
   log_info "사용법: sudo -u $PROJECT_NAME ./setup_project.sh"
   exit 1
fi

# 프로젝트 디렉토리 존재 확인
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "프로젝트 디렉토리가 존재하지 않습니다: $PROJECT_DIR"
    log_info "먼저 vultr_deploy.sh를 실행하세요."
    exit 1
fi

log_info "프로젝트 설정 시작..."
log_info "- 백엔드 디렉토리: $BACKEND_DIR"
log_info "- 프론트엔드 디렉토리: $FRONTEND_DIR"

# 1. 백엔드 설정
log_info "백엔드 Python 환경 설정 중..."
cd $BACKEND_DIR

# 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate

# Python 패키지 설치
log_info "Python 패키지 설치 중..."
pip install --upgrade pip
pip install -r requirements.txt

# Django 설정 확인
log_info "Django 설정 확인 중..."
python manage.py check

# 데이터베이스 마이그레이션
log_info "데이터베이스 마이그레이션 실행 중..."
python manage.py makemigrations
python manage.py migrate

# 정적 파일 수집
log_info "정적 파일 수집 중..."
python manage.py collectstatic --noinput

# 슈퍼유저 생성 (선택사항)
log_info "관리자 계정을 생성하시겠습니까? (y/N)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

# 2. 프론트엔드 설정
log_info "프론트엔드 설정 중..."
cd $FRONTEND_DIR

# Node.js 패키지 설치
log_info "Node.js 패키지 설치 중..."
npm install

# 프로덕션 빌드
log_info "프론트엔드 빌드 중..."
npm run build

# 3. 권한 설정
log_info "파일 권한 설정 중..."
sudo chown -R $PROJECT_NAME:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR/static
sudo chmod -R 755 $PROJECT_DIR/media
sudo chmod -R 755 $PROJECT_DIR/logs

# 미디어 디렉토리 쓰기 권한
sudo chmod -R 775 $PROJECT_DIR/media
sudo chmod -R 775 $PROJECT_DIR/backend/media

# 4. 서비스 재시작
log_info "서비스 재시작 중..."
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart $PROJECT_NAME
sudo systemctl reload nginx

# 5. 서비스 상태 확인
log_info "서비스 상태 확인 중..."
sleep 3

# Django 서비스 상태
if sudo supervisorctl status $PROJECT_NAME | grep -q "RUNNING"; then
    log_info "✅ Django 서비스가 정상적으로 실행 중입니다."
else
    log_error "❌ Django 서비스 실행에 문제가 있습니다."
    sudo supervisorctl status $PROJECT_NAME
fi

# Nginx 상태
if sudo systemctl is-active --quiet nginx; then
    log_info "✅ Nginx가 정상적으로 실행 중입니다."
else
    log_error "❌ Nginx 실행에 문제가 있습니다."
    sudo systemctl status nginx
fi

# PostgreSQL 상태
if sudo systemctl is-active --quiet postgresql; then
    log_info "✅ PostgreSQL이 정상적으로 실행 중입니다."
else
    log_error "❌ PostgreSQL 실행에 문제가 있습니다."
    sudo systemctl status postgresql
fi

# 6. 포트 확인
log_info "포트 사용 상태 확인..."
if netstat -tlnp | grep -q ":80.*LISTEN"; then
    log_info "✅ 웹 서버 포트 80이 열려있습니다."
else
    log_warn "⚠️  포트 80이 열려있지 않습니다."
fi

if netstat -tlnp | grep -q ":8000.*LISTEN"; then
    log_info "✅ Django 서버 포트 8000이 열려있습니다."
else
    log_warn "⚠️  Django 포트 8000이 열려있지 않습니다."
fi

# 7. 방화벽 설정 확인 및 설정
log_info "방화벽 설정 중..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
if ! sudo ufw status | grep -q "Status: active"; then
    log_warn "방화벽이 비활성화되어 있습니다. 활성화하시겠습니까? (y/N)"
    read -r enable_firewall
    if [[ $enable_firewall =~ ^[Yy]$ ]]; then
        sudo ufw --force enable
    fi
fi

# 8. SSL 인증서 설치 안내 (Let's Encrypt)
log_info ""
log_info "🔒 SSL 인증서 설치 (선택사항):"
log_info "도메인이 설정되어 있다면 다음 명령어로 SSL 인증서를 설치할 수 있습니다:"
log_info "sudo apt install certbot python3-certbot-nginx"
log_info "sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"

# 9. 로그 파일 위치 안내
log_info ""
log_info "📋 로그 파일 위치:"
log_info "- Django 로그: $PROJECT_DIR/logs/supervisor.log"
log_info "- Gunicorn 에러: $PROJECT_DIR/logs/gunicorn_error.log"
log_info "- Gunicorn 액세스: $PROJECT_DIR/logs/gunicorn_access.log"
log_info "- Nginx 에러: /var/log/nginx/error.log"
log_info "- Nginx 액세스: /var/log/nginx/access.log"

# 10. 완료 메시지
log_info ""
log_info "🎉 프로젝트 설정이 완료되었습니다!"
log_info ""
log_info "📋 다음 단계:"
log_info "1. 도메인 DNS를 서버 IP로 설정"
log_info "2. SSL 인증서 설치 (선택사항)"
log_info "3. 백업 스크립트 설정"
log_info "4. 모니터링 도구 설치 (선택사항)"
log_info ""
log_info "🌐 웹사이트 접속: http://your-server-ip"
log_info "🔧 관리자 페이지: http://your-server-ip/admin/"
log_info "📖 API 문서: http://your-server-ip/swagger/"
log_info ""
log_info "문제가 발생하시면 로그 파일을 확인해주세요." 