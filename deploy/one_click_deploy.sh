#!/bin/bash

# 🚀 ASL Holdem 원클릭 배포 스크립트
# Ubuntu 20.04/22.04 LTS에서 실행
#
# 사용법:
# 1. 기본값 사용: ./one_click_deploy.sh
# 2. 도메인 지정: ./one_click_deploy.sh www.kasl.co.kr
# 3. 도메인+이메일: ./one_click_deploy.sh www.kasl.co.kr admin@kasl.co.kr
#
# 서버 정보:
# IP: 141.164.36.65
# 도메인: www.kasl.co.kr

set -e

echo "🚀 ASL Holdem 원클릭 배포 시작!"
echo "서버 IP: 141.164.36.65"
echo "이 스크립트는 모든 것을 자동으로 설치합니다."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 도메인 설정 (기본값: www.kasl.co.kr)
DEFAULT_DOMAIN="www.kasl.co.kr"
if [ -n "$1" ]; then
    DOMAIN="$1"
    log_info "매개변수로 전달된 도메인 사용: $DOMAIN"
else
    read -p "🌐 도메인명을 입력하세요 (기본값: $DEFAULT_DOMAIN): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        DOMAIN="$DEFAULT_DOMAIN"
        log_info "기본 도메인 사용: $DOMAIN"
    fi
fi

# 관리자 이메일 설정
DEFAULT_EMAIL="admin@kasl.co.kr"
if [ -n "$2" ]; then
    ADMIN_EMAIL="$2"
    log_info "매개변수로 전달된 이메일 사용: $ADMIN_EMAIL"
else
    read -p "📧 관리자 이메일을 입력하세요 (기본값: $DEFAULT_EMAIL): " ADMIN_EMAIL
    if [ -z "$ADMIN_EMAIL" ]; then
        ADMIN_EMAIL="$DEFAULT_EMAIL"
        log_info "기본 이메일 사용: $ADMIN_EMAIL"
    fi
fi

# 변수 설정
PROJECT_NAME="asl_holdem"
PROJECT_DIR="/var/www/$PROJECT_NAME"
GITHUB_REPO="https://github.com/blue-0651/ASLHoldem_web.git"
DB_NAME="asl_db"
DB_USER="asl_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

log_info "배포 설정:"
log_info "- 도메인: $DOMAIN"
log_info "- 관리자 이메일: $ADMIN_EMAIL"
log_info "- 프로젝트 디렉토리: $PROJECT_DIR"
echo ""

log_step "1/10 시스템 업데이트 중..."
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y

log_step "2/10 필수 패키지 설치 중..."
# Python 3.11 저장소 추가 (Ubuntu 22.04에서 안정성을 위해)
add-apt-repository ppa:deadsnakes/ppa -y || true
apt update

apt install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    postgresql \
    postgresql-contrib \
    nginx \
    git \
    curl \
    build-essential \
    libpq-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff5-dev \
    libwebp-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    zlib1g-dev \
    libssl-dev \
    supervisor \
    ufw \
    htop \
    unzip

# Python 3.11을 기본으로 설정
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 || true

log_step "3/10 Node.js 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

log_step "4/10 방화벽 설정 중..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log_step "5/10 PostgreSQL 데이터베이스 설정 중..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET timezone TO 'Asia/Seoul';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

log_step "6/10 프로젝트 사용자 및 디렉토리 생성 중..."
useradd --system --gid www-data --shell /bin/bash --home $PROJECT_DIR $PROJECT_NAME || true
mkdir -p $PROJECT_DIR/{backend,frontend-v1,static,media,logs}
chown -R $PROJECT_NAME:www-data $PROJECT_DIR

log_step "7/10 프로젝트 코드 다운로드 중..."
cd /tmp
rm -rf ASLHoldem_web
git clone $GITHUB_REPO
cd ASLHoldem_web

# 백엔드 파일 복사
cp -r backend/* $PROJECT_DIR/backend/
cp -r frontend-v1/* $PROJECT_DIR/frontend-v1/
cp -r docs $PROJECT_DIR/ || true
cp -r deploy $PROJECT_DIR/ || true

# run.sh 파일 복사
cp run.sh $PROJECT_DIR/ || true
chmod +x $PROJECT_DIR/run.sh

# 권한 설정
chown -R $PROJECT_NAME:www-data $PROJECT_DIR

log_step "8/10 환경 파일 생성 중..."
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')

cat > $PROJECT_DIR/backend/.env << EOF
DEBUG=False
SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://$DOMAIN,http://$DOMAIN,https://www.$DOMAIN,http://www.$DOMAIN,http://localhost:3000

# Static/Media
STATIC_URL=/static/
MEDIA_URL=/media/
STATIC_ROOT=$PROJECT_DIR/static
MEDIA_ROOT=$PROJECT_DIR/media
EOF

chown $PROJECT_NAME:www-data $PROJECT_DIR/backend/.env

log_step "9/10 백엔드 설정 중..."
cd $PROJECT_DIR/backend
sudo -u $PROJECT_NAME python3.11 -m venv .venv
sudo -u $PROJECT_NAME .venv/bin/pip install --upgrade pip
sudo -u $PROJECT_NAME .venv/bin/pip install -r requirements.txt

sudo -u $PROJECT_NAME .venv/bin/python manage.py makemigrations || true
sudo -u $PROJECT_NAME .venv/bin/python manage.py migrate
sudo -u $PROJECT_NAME .venv/bin/python manage.py collectstatic --noinput

log_step "10/10 프론트엔드 빌드 중..."
cd $PROJECT_DIR/frontend-v1
sudo -u $PROJECT_NAME npm install
sudo -u $PROJECT_NAME npm run build

# Gunicorn 설정
cat > $PROJECT_DIR/gunicorn_config.py << EOF
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
user = "$PROJECT_NAME"
group = "www-data"
tmp_upload_dir = None
errorlog = "$PROJECT_DIR/logs/gunicorn_error.log"
accesslog = "$PROJECT_DIR/logs/gunicorn_access.log"
capture_output = True
enable_stdio_inheritance = True
EOF

# Supervisor 설정
cat > /etc/supervisor/conf.d/$PROJECT_NAME.conf << EOF
[program:$PROJECT_NAME]
command=$PROJECT_DIR/backend/.venv/bin/gunicorn asl_holdem.wsgi:application -c $PROJECT_DIR/gunicorn_config.py
directory=$PROJECT_DIR/backend
user=$PROJECT_NAME
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=$PROJECT_DIR/logs/supervisor.log
environment=PATH="$PROJECT_DIR/backend/.venv/bin"
EOF

# Nginx 설정
cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
upstream $PROJECT_NAME {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    client_max_body_size 10M;
    
    # Frontend (React build)
    location / {
        root $PROJECT_DIR/frontend-v1/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://$PROJECT_NAME;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
    
    # Admin
    location /admin/ {
        proxy_pass http://$PROJECT_NAME;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
    
    # Static files
    location /static/ {
        alias $PROJECT_DIR/static/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Media files
    location /media/ {
        alias $PROJECT_DIR/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Nginx 사이트 활성화
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 권한 설정
chown -R $PROJECT_NAME:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 775 $PROJECT_DIR/media
chmod -R 755 $PROJECT_DIR/logs

# 서비스 시작
systemctl enable postgresql nginx supervisor
systemctl start postgresql nginx
supervisorctl reread
supervisorctl update
supervisorctl start $PROJECT_NAME

# 서비스 상태 확인
sleep 5

echo ""
echo "🎉 배포 완료!"
echo ""
echo "📋 생성된 정보:"
echo "- 도메인: $DOMAIN"
echo "- 데이터베이스 사용자: $DB_USER"
echo "- 데이터베이스 비밀번호: $DB_PASSWORD"
echo "- 프로젝트 디렉토리: $PROJECT_DIR"
echo ""
echo "🌐 웹사이트 접속:"
echo "- 메인: http://$DOMAIN"
echo "- 관리자: http://$DOMAIN/admin/"
echo "- API 문서: http://$DOMAIN/swagger/"
echo ""
echo "📊 서비스 상태:"
if supervisorctl status $PROJECT_NAME | grep -q "RUNNING"; then
    echo "✅ Django: 실행 중"
else
    echo "❌ Django: 오류"
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: 실행 중"
else
    echo "❌ Nginx: 오류"
fi

if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL: 실행 중"
else
    echo "❌ PostgreSQL: 오류"
fi

echo ""
echo "🔐 중요: 데이터베이스 정보를 안전한 곳에 저장하세요!"
echo ""
echo "🔒 SSL 인증서 설치 (선택사항):"
echo "sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "📋 로그 확인:"
echo "sudo supervisorctl tail -f $PROJECT_NAME"
echo "sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🎊 배포가 성공적으로 완료되었습니다!"

# 데이터베이스 정보를 파일로 저장
cat > $PROJECT_DIR/DEPLOYMENT_INFO.txt << EOF
ASL Holdem 배포 정보
==================

배포 일시: $(date)
도메인: $DOMAIN
서버 IP: $(curl -s ifconfig.me || echo "Unknown")

데이터베이스 정보:
- 데이터베이스명: $DB_NAME
- 사용자명: $DB_USER
- 비밀번호: $DB_PASSWORD
- 호스트: localhost
- 포트: 5432

프로젝트 경로: $PROJECT_DIR

웹사이트:
- 메인: http://$DOMAIN
- 관리자: http://$DOMAIN/admin/
- API: http://$DOMAIN/api/
- 문서: http://$DOMAIN/swagger/

중요한 명령어:
- 서비스 재시작: sudo supervisorctl restart $PROJECT_NAME
- 로그 확인: sudo supervisorctl tail -f $PROJECT_NAME
- Nginx 재시작: sudo systemctl restart nginx

이 파일을 안전한 곳에 보관하세요!
EOF

chown $PROJECT_NAME:www-data $PROJECT_DIR/DEPLOYMENT_INFO.txt
chmod 600 $PROJECT_DIR/DEPLOYMENT_INFO.txt 