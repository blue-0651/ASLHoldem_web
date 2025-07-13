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
sudo mkdir -p /var/www/asl_holdem
sudo chown -R $USER:$USER /var/www/asl_holdem
cd /var/www/asl_holdem
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

### 2. Django 데이터베이스 마이그레이션
```bash
cd /var/www/asl_holdem/backend
source .venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

## 정적 파일 설정

### 1. 정적 파일 수집
```bash
cd /var/www/asl_holdem/backend
source .venv/bin/activate
python manage.py collectstatic --noinput
```

### 2. 정적 파일 권한 설정
```bash
sudo chown -R www-data:www-data /var/www/asl_holdem/backend/static/
sudo chmod -R 755 /var/www/asl_holdem/backend/static/
```

## 미디어 파일 권한 설정

### 🎯 배너 업로드 권한 문제 해결

배너 이미지 업로드 시 500 에러가 발생하는 경우, 다음 단계를 따라 권한을 설정하세요:

#### 1. 권한 상태 확인
```bash
cd /var/www/asl_holdem
bash deploy/check_media_permissions.sh
```

#### 2. 일반적인 권한 수정
```bash
sudo bash deploy/fix_media_permissions.sh
```

#### 3. ⚠️ Django 사용자 권한 문제 해결 (추가)
만약 위의 방법으로도 해결되지 않고, Django 프로세스 사용자와 media 폴더 소유자가 다른 경우:

```bash
# Django 프로세스 사용자 확인
ps aux | grep -E "(gunicorn|python.*manage.py)" | grep -v grep | head -1

# Django 사용자 권한 동기화 스크립트 실행
sudo bash deploy/fix_django_user_permissions.sh
```

**사용 시나리오:**
- Django 프로세스가 `asl_holdem` 사용자로 실행되는 경우
- Media 폴더가 `www-data` 소유자로 설정되어 있는 경우
- 일반적인 권한 수정 후에도 여전히 배너 업로드가 실패하는 경우

#### 4. 수동 권한 설정 (필요한 경우)
```bash
# 미디어 디렉토리 생성
sudo mkdir -p /var/www/asl_holdem/backend/media/{banner_images,store_images,qr_codes,user_images}

# 소유자 변경
sudo chown -R www-data:www-data /var/www/asl_holdem/backend/media/

# 권한 설정
sudo chmod -R 755 /var/www/asl_holdem/backend/media/
sudo find /var/www/asl_holdem/backend/media -type f -exec chmod 644 {} \;
```

#### 5. 권한 테스트
```bash
# 테스트 파일 생성 시도
sudo -u www-data touch /var/www/asl_holdem/backend/media/banner_images/test.txt
sudo -u www-data echo "test" > /var/www/asl_holdem/backend/media/banner_images/test.txt
sudo -u www-data rm /var/www/asl_holdem/backend/media/banner_images/test.txt
```

### 🔍 권한 문제 진단 가이드

#### 권한 문제 증상:
1. **배너 추가 시 500 Internal Server Error**
2. **로그에 "Permission denied" 메시지**
3. **파일 업로드 실패**

#### 권한 문제 원인별 해결책:

**Case 1: 일반적인 권한 문제**
```bash
sudo bash deploy/fix_media_permissions.sh
```

**Case 2: Django 프로세스 사용자 불일치**
```bash
# 프로세스 사용자 확인
ps aux | grep gunicorn | head -1

# Django 사용자 권한 동기화
sudo bash deploy/fix_django_user_permissions.sh
```

**Case 3: 웹 서버 접근 권한 문제**
```bash
# Nginx 설정 확인
sudo nginx -t
sudo systemctl restart nginx

# Media 폴더 접근 권한 확인
curl -I http://your-domain.com/media/banner_images/
```

## 서비스 설정

### 1. Gunicorn 설정
```bash
# Gunicorn 서비스 파일 생성
sudo nano /etc/systemd/system/gunicorn.service
```

```ini
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/asl_holdem/backend
Environment=PYTHONPATH=/var/www/asl_holdem/backend
ExecStart=/var/www/asl_holdem/backend/.venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/var/www/asl_holdem/backend/gunicorn.sock asl_holdem.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Nginx 설정
```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/asl_holdem
```

```nginx
server {
    listen 80;
    server_name your_domain.com;
    
    location /static/ {
        alias /var/www/asl_holdem/backend/static/;
    }
    
    location /media/ {
        alias /var/www/asl_holdem/backend/media/;
    }
    
    location / {
        proxy_pass http://unix:/var/www/asl_holdem/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 서비스 활성화
```bash
# 서비스 등록 및 시작
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn

# Nginx 설정 활성화
sudo ln -sf /etc/nginx/sites-available/asl_holdem /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 문제 해결

### 배너 업로드 500 에러
```bash
# 1. 권한 확인
bash deploy/check_media_permissions.sh

# 2. 권한 수정
sudo bash deploy/fix_media_permissions.sh

# 3. 서비스 재시작
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### 로그 확인
```bash
# Gunicorn 로그
sudo journalctl -u gunicorn -f

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# Django 로그
tail -f /var/www/asl_holdem/backend/logs/django.log
```

### 서비스 상태 확인
```bash
# 서비스 상태 확인
sudo systemctl status gunicorn
sudo systemctl status nginx

# 포트 확인
sudo netstat -tlnp | grep :80
```

## 보안 설정

### 1. 방화벽 설정
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL 인증서 설정 (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

### 3. 정기 업데이트
```bash
# 자동 갱신 설정
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## 모니터링

### 1. 로그 로테이션
```bash
sudo nano /etc/logrotate.d/asl_holdem
```

```
/var/www/asl_holdem/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload gunicorn
    endscript
}
```

### 2. 시스템 리소스 모니터링
```bash
# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h

# 프로세스 상태 확인
ps aux | grep -E "(gunicorn|nginx)"
```

---

이 가이드를 따라 배포하면 ASL Holdem 웹 애플리케이션이 안정적으로 실행됩니다. 문제가 발생하면 로그를 확인하고 해당 섹션의 해결 방법을 참고하세요. 