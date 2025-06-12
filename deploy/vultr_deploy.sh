#!/bin/bash

# ASL Holdem Vultr 서버 배포 스크립트
# Ubuntu 20.04/22.04 LTS 기준

set -e  # 에러 발생시 스크립트 중단

echo "🚀 ASL Holdem Vultr 서버 배포 시작"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 변수 설정
PROJECT_NAME="asl_holdem"
PROJECT_DIR="/var/www/$PROJECT_NAME"
DOMAIN="${1:-your-domain.com}"  # 첫 번째 인자로 도메인 입력
DB_NAME="asl_db"
DB_USER="asl_user"
DB_PASSWORD=$(openssl rand -base64 32)
ADMIN_EMAIL="${2:-admin@$DOMAIN}"

log_info "배포 설정:"
log_info "- 프로젝트 디렉토리: $PROJECT_DIR"
log_info "- 도메인: $DOMAIN"
log_info "- 데이터베이스: $DB_NAME"
log_info "- 관리자 이메일: $ADMIN_EMAIL"

# 1. 시스템 업데이트
log_info "시스템 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# 2. 필수 패키지 설치
log_info "필수 패키지 설치 중..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    postgresql \
    postgresql-contrib \
    nginx \
    git \
    curl \
    build-essential \
    libpq-dev \
    libffi-dev \
    libjpeg-dev \
    libssl-dev \
    zlib1g-dev \
    supervisor

# 3. Node.js 및 npm 설치 (최신 LTS)
log_info "Node.js 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. PostgreSQL 설정
log_info "PostgreSQL 설정 중..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE $DB_USER SET timezone TO 'Asia/Seoul';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# 5. 프로젝트 사용자 생성
log_info "프로젝트 사용자 생성 중..."
sudo useradd --system --gid www-data --shell /bin/bash --home $PROJECT_DIR $PROJECT_NAME || true
sudo mkdir -p $PROJECT_DIR
sudo chown $PROJECT_NAME:www-data $PROJECT_DIR

# 6. 프로젝트 디렉토리로 이동 및 권한 설정
log_info "프로젝트 파일 복사 준비..."
sudo mkdir -p $PROJECT_DIR/{backend,frontend-v1,static,media,logs}
sudo chown -R $PROJECT_NAME:www-data $PROJECT_DIR

# 7. 환경 파일 생성
log_info "환경 설정 파일 생성 중..."
sudo -u $PROJECT_NAME tee $PROJECT_DIR/backend/.env > /dev/null <<EOF
DEBUG=False
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=$DOMAIN,localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://$DOMAIN,http://$DOMAIN,http://localhost:3000

# Static/Media
STATIC_URL=/static/
MEDIA_URL=/media/
EOF

# 8. Gunicorn 설정
log_info "Gunicorn 설정 생성 중..."
sudo -u $PROJECT_NAME tee $PROJECT_DIR/gunicorn_config.py > /dev/null <<EOF
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

# 9. Nginx 설정
log_info "Nginx 설정 생성 중..."
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null <<EOF
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
    
    # API Documentation
    location ~ ^/(swagger|redoc)/ {
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
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 10. Supervisor 설정 (Django 프로세스 관리)
log_info "Supervisor 설정 생성 중..."
sudo tee /etc/supervisor/conf.d/$PROJECT_NAME.conf > /dev/null <<EOF
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

# 11. 로그 디렉토리 권한 설정
sudo chown -R $PROJECT_NAME:www-data $PROJECT_DIR/logs
sudo chmod -R 755 $PROJECT_DIR/logs

# 12. 서비스 설정 및 시작
log_info "서비스 설정 중..."
sudo systemctl enable postgresql nginx supervisor
sudo systemctl start postgresql nginx

log_info "🎉 서버 설정 완료!"
log_info ""
log_info "📋 배포 완료 후 수행할 작업:"
log_info "1. 프로젝트 파일을 $PROJECT_DIR 에 복사"
log_info "2. deploy/setup_project.sh 실행"
log_info ""
log_info "📊 생성된 정보:"
log_info "- 데이터베이스 사용자: $DB_USER"
log_info "- 데이터베이스 비밀번호: $DB_PASSWORD"
log_info "- 프로젝트 디렉토리: $PROJECT_DIR"
log_info ""
log_info "💾 데이터베이스 정보를 안전한 곳에 저장하세요!"

# 데이터베이스 정보를 파일로 저장
sudo -u $PROJECT_NAME tee $PROJECT_DIR/db_credentials.txt > /dev/null <<EOF
Database Name: $DB_NAME
Database User: $DB_USER  
Database Password: $DB_PASSWORD
Database Host: localhost
Database Port: 5432
EOF

sudo chmod 600 $PROJECT_DIR/db_credentials.txt 