# ASL Holdem 웹 애플리케이션

포커 토너먼트 및 매장 관리를 위한 종합 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 로컬 개발 환경 설정
```bash
# 백엔드 설정
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 프론트엔드 설정
cd frontend-v1
npm install
npm start
```

### 배포 서버 설정
```bash
# 기본 배포 설정
sudo bash deploy/deploy_backend.sh
sudo bash deploy/deploy_frontend.sh

# 배너 업로드 권한 문제 해결
sudo bash deploy/fix_media_permissions.sh

# Django 사용자 권한 동기화 (필요한 경우)
sudo bash deploy/fix_django_user_permissions.sh
```

## 🔧 배포 스크립트

### 권한 관리 스크립트
- **`deploy/check_media_permissions.sh`** - 미디어 파일 권한 상태 확인
- **`deploy/fix_media_permissions.sh`** - 일반적인 미디어 파일 권한 수정
- **`deploy/fix_django_user_permissions.sh`** - Django 프로세스 사용자와 미디어 폴더 권한 동기화

### 배포 스크립트 
- **`deploy/deploy_backend.sh`** - 백엔드 배포 자동화
- **`deploy/deploy_frontend.sh`** - 프론트엔드 배포 자동화

## 📋 주요 기능

### 사용자 관리
- 일반 사용자 및 매장 관리자 인증
- 사용자 프로필 관리
- SEAT권 구매 및 관리

### 토너먼트 관리
- 토너먼트 생성 및 관리
- 참가자 등록 및 관리
- 실시간 경기 결과 업데이트

### 매장 관리
- 매장 정보 관리
- 배너 관리
- 공지사항 관리

## 🛠️ 기술 스택

### 백엔드
- **Django 4.2** - 웹 프레임워크
- **Django REST Framework** - API 서버
- **PostgreSQL** - 데이터베이스

### 프론트엔드
- **React 18** - 사용자 인터페이스
- **React Router** - 클라이언트 라우팅
- **Axios** - HTTP 클라이언트

### 배포
- **Nginx** - 웹 서버
- **Gunicorn** - WSGI 서버
- **SSL/TLS** - 보안 통신

## 📖 문서

- **[배포 가이드](docs/DEPLOYMENT_GUIDE.md)** - 상세한 배포 절차
- **[API 문서](docs/API_Collection.json)** - API 명세서
- **[관리자 로그인 수정](docs/ADMIN_LOGIN_FIX.md)** - 관리자 로그인 문제 해결

## 🔍 문제 해결

### 배너 업로드 500 에러
```bash
# 1. 권한 상태 확인
bash deploy/check_media_permissions.sh

# 2. 일반적인 권한 수정
sudo bash deploy/fix_media_permissions.sh

# 3. Django 사용자 권한 동기화 (추가)
sudo bash deploy/fix_django_user_permissions.sh
```

### 로그 확인
```bash
# Django 로그
tail -f /var/www/asl_holdem/backend/logs/django.log

# Nginx 로그
sudo tail -f /var/log/nginx/error.log

# Gunicorn 로그
sudo journalctl -u gunicorn -f
```

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
1. 로그 파일 확인
2. 문제 해결 가이드 참조
3. 이슈 트래커에 문제 보고

---

**화이팅!** 🎯 