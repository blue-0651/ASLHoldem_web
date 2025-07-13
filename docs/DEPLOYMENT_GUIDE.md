# ASL Holdem 배포 가이드

## 목차
- [배포 환경 설정](#배포-환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [정적 파일 설정](#정적-파일-설정)
- [미디어 파일 권한 설정](#미디어-파일-권한-설정)
- [서비스 설정](#서비스-설정)
- [문제 해결](#문제-해결)

## 배포 환경 설정

### 1. 프로젝트 디렉토리 설정
```bash
sudo mkdir -p /var/www/ASLHoldem_web
sudo chown -R $USER:$USER /var/www/ASLHoldem_web
cd /var/www/ASLHoldem_web
git clone [repository_url] .
```

### 2. 가상환경 설정
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env
# 환경 변수 수정
nano .env
```

## 데이터베이스 설정

### 1. PostgreSQL 설정
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE asl_db;
CREATE USER asl_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE asl_db TO asl_user;
\q
```

### 2. Django 마이그레이션
```bash
cd backend
source .venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic
```

## 정적 파일 설정

### 1. Nginx 설정
```nginx
server {
    listen 80;
    server_name your_domain.com;
    
    location /static/ {
        alias /var/www/ASLHoldem_web/backend/static/;
    }
    
    location /media/ {
        alias /var/www/ASLHoldem_web/backend/media/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 미디어 파일 권한 설정

### ⚠️ 배너 이미지 업로드 권한 문제 해결

배포서버에서 배너 추가 시 500 에러가 발생하는 경우, 미디어 파일 업로드 권한 문제일 가능성이 높습니다.

#### 1. 권한 상태 확인
```bash
# 프로젝트 루트에서 실행
bash deploy/check_media_permissions.sh
```

#### 2. 권한 자동 수정
```bash
# 프로젝트 루트에서 실행
sudo bash deploy/fix_media_permissions.sh
```

#### 3. 수동 권한 설정
```bash
# 프로젝트 루트에서 실행
cd /var/www/ASLHoldem_web

# 미디어 폴더 생성 (없는 경우)
sudo mkdir -p backend/media/banner_images
sudo mkdir -p backend/media/store_images
sudo mkdir -p backend/media/qr_codes

# 웹서버 사용자 확인 (www-data, apache, nginx 등)
WEB_USER="www-data"  # 시스템에 따라 변경

# 폴더 소유자 변경
sudo chown -R $WEB_USER:$WEB_USER backend/media/

# 폴더 권한 설정
sudo chmod -R 755 backend/media/
sudo find backend/media/ -type f -exec chmod 644 {} \;

# 특별히 banner_images 폴더 권한 확인
sudo chmod 755 backend/media/banner_images/
sudo chown $WEB_USER:$WEB_USER backend/media/banner_images/
```

#### 4. 서비스 재시작
```bash
sudo systemctl restart nginx
sudo systemctl restart gunicorn  # 또는 uwsgi
```

#### 5. SELinux 설정 (CentOS/RHEL)
```bash
# SELinux가 활성화된 경우
sudo setsebool -P httpd_can_network_connect 1
sudo semanage fcontext -a -t httpd_exec_t '/var/www/ASLHoldem_web/backend/media(/.*)?'
sudo restorecon -Rv /var/www/ASLHoldem_web/backend/media/
```

### 권한 문제 증상
- 배너 추가 시 500 Internal Server Error
- 로그에 "Permission denied" 메시지
- 파일 업로드 실패

### 권한 문제 해결 확인
1. 배너 관리 페이지에서 새 배너 추가 시도
2. 이미지 업로드가 정상적으로 완료되는지 확인
3. 업로드된 이미지가 웹에서 정상적으로 표시되는지 확인

## 서비스 설정

### 1. Gunicorn 설정
```bash
# gunicorn.service 파일 생성
sudo nano /etc/systemd/system/gunicorn.service
```

```ini
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ASLHoldem_web/backend
ExecStart=/var/www/ASLHoldem_web/backend/.venv/bin/gunicorn --access-logfile - --workers 3 --bind 127.0.0.1:8000 asl_holdem.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 2. 서비스 시작
```bash
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 문제 해결

### 1. 배너 업로드 500 에러
```bash
# 권한 확인 및 수정
bash deploy/check_media_permissions.sh
sudo bash deploy/fix_media_permissions.sh
sudo systemctl restart nginx gunicorn
```

### 2. 정적 파일 404 에러
```bash
cd backend
python manage.py collectstatic --noinput
sudo systemctl restart nginx
```

### 3. 데이터베이스 연결 오류
```bash
# 데이터베이스 상태 확인
sudo systemctl status postgresql
# 연결 테스트
python manage.py dbshell
```

### 4. 로그 확인
```bash
# Nginx 로그
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Gunicorn 로그
sudo journalctl -u gunicorn -f

# Django 로그
tail -f backend/logs/django.log
```

### 5. 프로세스 상태 확인
```bash
# 서비스 상태 확인
sudo systemctl status nginx
sudo systemctl status gunicorn

# 프로세스 확인
ps aux | grep gunicorn
ps aux | grep nginx
```

## 보안 설정

### 1. 방화벽 설정
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### 2. SSL 인증서 설정
```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your_domain.com
```

### 3. 자동 갱신 설정
```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# 크론탭 설정
sudo crontab -e
# 다음 라인 추가
0 12 * * * /usr/bin/certbot renew --quiet
```

## 성능 최적화

### 1. Gunicorn 워커 수 설정
```bash
# CPU 코어 수 * 2 + 1
workers = (2 * cpu_cores) + 1
```

### 2. Nginx 캐시 설정
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. PostgreSQL 최적화
```sql
-- shared_buffers 설정
shared_buffers = 256MB

-- effective_cache_size 설정  
effective_cache_size = 1GB
```

## 모니터링

### 1. 시스템 모니터링
```bash
# 시스템 리소스 확인
htop
df -h
free -h
```

### 2. 애플리케이션 모니터링
```bash
# Django 로그 모니터링
tail -f backend/logs/django.log

# 응답 시간 확인
curl -w "@curl-format.txt" -o /dev/null -s "http://your_domain.com"
```

화이팅! 