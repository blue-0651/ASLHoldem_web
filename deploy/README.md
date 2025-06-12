# ASL Holdem Vultr 서버 배포 가이드

## 📋 개요

이 가이드는 ASL Holdem 프로젝트를 Vultr 리눅스 서버에 배포하는 방법을 설명합니다.

## 🖥️ 시스템 요구사항

### 최소 사양
- **CPU**: 1 vCPU
- **RAM**: 2GB
- **스토리지**: 25GB SSD
- **OS**: Ubuntu 20.04/22.04 LTS

### 권장 사양
- **CPU**: 2 vCPU
- **RAM**: 4GB
- **스토리지**: 55GB SSD
- **OS**: Ubuntu 22.04 LTS

## 🚀 배포 과정

### 1단계: Vultr 서버 생성
1. Vultr 계정 생성 및 로그인
2. 새 서버 인스턴스 생성
   - **지역**: 서울 (Asia, Seoul)
   - **서버 타입**: Regular Performance
   - **OS**: Ubuntu 22.04 LTS
   - **사양**: 최소 2GB RAM 권장
3. SSH 키 설정 (권장)
4. 서버 배포 완료 대기

### 2단계: 초기 서버 설정
```bash
# 서버 접속
ssh root@your-server-ip

# 시스템 업데이트
apt update && apt upgrade -y

# 방화벽 설정
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 3단계: 배포 스크립트 실행
```bash
# 프로젝트 다운로드
cd /tmp
git clone https://github.com/your-username/ASLHoldem_web.git
cd ASLHoldem_web

# 배포 스크립트 실행 권한 부여
chmod +x deploy/vultr_deploy.sh

# 배포 스크립트 실행 (도메인명 입력)
./deploy/vultr_deploy.sh your-domain.com admin@your-domain.com
```

### 4단계: 프로젝트 파일 복사
```bash
# 프로젝트 파일을 서버 디렉토리로 복사
cp -r backend/* /var/www/asl_holdem/backend/
cp -r frontend-v1/* /var/www/asl_holdem/frontend-v1/
cp -r docs /var/www/asl_holdem/

# 배포 디렉토리 복사
cp -r deploy /var/www/asl_holdem/
```

### 5단계: 프로젝트 설정
```bash
# 프로젝트 설정 스크립트 실행
cd /var/www/asl_holdem
chmod +x deploy/setup_project.sh
sudo -u asl_holdem ./deploy/setup_project.sh
```

## 🔧 설정 파일 구조

```
/var/www/asl_holdem/
├── backend/
│   ├── .env                 # 환경 변수
│   ├── .venv/               # Python 가상환경
│   ├── manage.py
│   └── ...
├── frontend-v1/
│   ├── dist/                # 빌드된 React 앱
│   ├── package.json
│   └── ...
├── static/                  # Django 정적 파일
├── media/                   # 업로드된 미디어 파일
├── logs/                    # 로그 파일
├── gunicorn_config.py       # Gunicorn 설정
└── db_credentials.txt       # 데이터베이스 정보
```

## 🌐 서비스 구조

```
[Internet] → [Nginx:80] → [Gunicorn:8000] → [Django App]
                      ↓
              [Static Files] + [Media Files]
                      ↓
              [PostgreSQL Database]
```

## 📊 환경 변수 설정

배포 과정에서 자동으로 생성되는 `.env` 파일:

```bash
DEBUG=False
SECRET_KEY=자동생성된_보안키
ALLOWED_HOSTS=your-domain.com,localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=asl_db
DB_USER=asl_user
DB_PASSWORD=자동생성된_비밀번호
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-domain.com
```

## 🔐 SSL 인증서 설치 (선택사항)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 줄 추가:
0 3 * * * /usr/bin/certbot renew --quiet
```

## 📋 서비스 관리 명령어

### Django 애플리케이션
```bash
# 상태 확인
sudo supervisorctl status asl_holdem

# 재시작
sudo supervisorctl restart asl_holdem

# 로그 확인
sudo supervisorctl tail -f asl_holdem
```

### Nginx
```bash
# 상태 확인
sudo systemctl status nginx

# 재시작
sudo systemctl restart nginx

# 설정 테스트
sudo nginx -t
```

### PostgreSQL
```bash
# 상태 확인
sudo systemctl status postgresql

# 데이터베이스 접속
sudo -u postgres psql asl_db
```

## 📖 로그 파일 위치

| 서비스 | 로그 파일 위치 |
|--------|---------------|
| Django | `/var/www/asl_holdem/logs/supervisor.log` |
| Gunicorn Error | `/var/www/asl_holdem/logs/gunicorn_error.log` |
| Gunicorn Access | `/var/www/asl_holdem/logs/gunicorn_access.log` |
| Nginx Error | `/var/log/nginx/error.log` |
| Nginx Access | `/var/log/nginx/access.log` |
| PostgreSQL | `/var/log/postgresql/` |

## 🔧 문제 해결

### 일반적인 문제들

1. **서비스가 시작되지 않는 경우**
   ```bash
   # 로그 확인
   sudo supervisorctl tail -f asl_holdem
   
   # 설정 파일 확인
   sudo -u asl_holdem python /var/www/asl_holdem/backend/manage.py check
   ```

2. **정적 파일이 로드되지 않는 경우**
   ```bash
   # 정적 파일 재수집
   cd /var/www/asl_holdem/backend
   sudo -u asl_holdem .venv/bin/python manage.py collectstatic --noinput
   
   # Nginx 재시작
   sudo systemctl restart nginx
   ```

3. **데이터베이스 연결 오류**
   ```bash
   # PostgreSQL 상태 확인
   sudo systemctl status postgresql
   
   # 데이터베이스 연결 테스트
   sudo -u postgres psql -c "SELECT version();"
   ```

4. **포트 충돌**
   ```bash
   # 포트 사용 확인
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :8000
   ```

## 📈 모니터링 및 백업

### 시스템 모니터링 (선택사항)
```bash
# htop 설치
sudo apt install htop

# 시스템 리소스 모니터링
htop
```

### 데이터베이스 백업
```bash
# 백업 스크립트 예시
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump asl_db > /backup/asl_db_$DATE.sql
```

## 🌐 접속 URL

배포 완료 후 다음 URL로 접속할 수 있습니다:

- **메인 사이트**: `http://your-domain.com`
- **관리자 페이지**: `http://your-domain.com/admin/`
- **API 문서**: `http://your-domain.com/swagger/`
- **광고 페이지**: `http://your-domain.com/mobile/advertisement`

## 🚨 보안 권장사항

1. **정기적인 시스템 업데이트**
2. **강력한 비밀번호 사용**
3. **SSH 키 인증 사용**
4. **방화벽 설정 유지**
5. **SSL 인증서 사용**
6. **정기적인 백업**
7. **로그 모니터링**

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. 로그 파일 검토
2. 서비스 상태 확인
3. 환경 변수 설정 확인
4. 네트워크 연결 상태 확인

---

**주의**: 이 가이드는 Ubuntu 22.04 LTS 기준으로 작성되었습니다. 다른 Linux 배포판에서는 일부 명령어가 다를 수 있습니다. 