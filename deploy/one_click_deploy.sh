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
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
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

# 시스템 Python 버전 확인
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d" " -f2 | cut -d"." -f1-2)
log_info "시스템 Python 버전: $PYTHON_VERSION"

# Python 3.11 설치 시도 (선택적)
log_info "Python 3.11 설치를 시도합니다..."
if ! python3.11 --version &> /dev/null; then
    # Ubuntu 버전 확인
    UBUNTU_VERSION=$(lsb_release -cs 2>/dev/null || echo "unknown")
    log_info "Ubuntu 버전: $UBUNTU_VERSION"
    
    if [[ "$UBUNTU_VERSION" != "plucky" ]] && [[ "$UBUNTU_VERSION" != "unknown" ]]; then
        # plucky가 아닌 경우에만 deadsnakes PPA 사용
        add-apt-repository ppa:deadsnakes/ppa -y || log_warning "deadsnakes PPA 추가에 실패했습니다."
        apt update || log_warning "패키지 목록 업데이트에 실패했습니다."
        
        if apt install -y python3.11 python3.11-venv python3.11-dev 2>/dev/null; then
            log_success "Python 3.11이 설치되었습니다."
            PYTHON_CMD="python3.11"
        else
            log_warning "Python 3.11 설치에 실패했습니다. 시스템 Python을 사용합니다."
            PYTHON_CMD="python3"
        fi
    else
        log_warning "Ubuntu $UBUNTU_VERSION에서는 deadsnakes PPA를 사용할 수 없습니다. 시스템 Python을 사용합니다."
        PYTHON_CMD="python3"
    fi
else
    log_success "Python 3.11이 이미 설치되어 있습니다."
    PYTHON_CMD="python3.11"
fi

# 실제 사용할 Python 버전 확인
ACTUAL_PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d" " -f2 | cut -d"." -f1-2)
log_info "사용할 Python 버전: $ACTUAL_PYTHON_VERSION"

# 기본 패키지 설치
apt install -y \
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

# Python 버전별 호환성 메시지
if [[ "$ACTUAL_PYTHON_VERSION" == "3.13" ]]; then
    log_warning "Python 3.13을 감지했습니다. psycopg3를 사용하여 PostgreSQL 호환성을 확보합니다."
elif [[ "$ACTUAL_PYTHON_VERSION" == "3.12" ]] || [[ "$ACTUAL_PYTHON_VERSION" == "3.11" ]]; then
    log_success "Python $ACTUAL_PYTHON_VERSION은 완전히 지원됩니다."
else
    log_warning "Python $ACTUAL_PYTHON_VERSION을 사용합니다. 호환성 문제가 발생할 수 있습니다."
fi

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

# 데이터베이스 소유권 및 스키마 권한 설정
log_info "데이터베이스 권한 설정 중..."
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

log_success "PostgreSQL 데이터베이스 및 권한 설정이 완료되었습니다."

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
SECRET_KEY=$($PYTHON_CMD -c 'import secrets; print(secrets.token_urlsafe(50))')

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
sudo -u $PROJECT_NAME $PYTHON_CMD -m venv .venv
sudo -u $PROJECT_NAME .venv/bin/pip install --upgrade pip

# Python 3.13 호환성을 위한 setuptools 설치
if [[ "$ACTUAL_PYTHON_VERSION" == "3.13" ]]; then
    log_info "Python 3.13 호환성을 위해 setuptools를 먼저 설치합니다..."
    sudo -u $PROJECT_NAME .venv/bin/pip install --upgrade setuptools>=70.0.0
fi

sudo -u $PROJECT_NAME .venv/bin/pip install -r requirements.txt

sudo -u $PROJECT_NAME .venv/bin/python manage.py makemigrations || true
sudo -u $PROJECT_NAME .venv/bin/python manage.py migrate
sudo -u $PROJECT_NAME .venv/bin/python manage.py collectstatic --noinput

log_step "10/10 프론트엔드 빌드 중..."
cd $PROJECT_DIR/frontend-v1
sudo -u $PROJECT_NAME npm install
# 기존 빌드 폴더 제거
rm -rf dist
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