# ASL Holdem 백엔드

Django 기반 ASL Holdem 백엔드 서비스입니다.

## 설치 및 실행

1. 가상환경 생성 및 활성화
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```

2. 의존성 설치
   ```bash
   pip install -r requirements.txt
   ```

3. 데이터베이스 마이그레이션
   ```bash
   python manage.py migrate
   ```

4. 서버 실행
   ```bash
   python manage.py runserver
   ```

## 환경 설정

`.env` 파일에 다음 환경 변수를 설정하세요:

```
# Django 설정
SECRET_KEY=django-insecure-asdf1234&%$#@!^_)(*&^%$#@!asdf1234
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 데이터베이스 설정
DB_ENGINE=django.db.backends.postgresql
DB_NAME=asl_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS 설정
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

## 앱 구조

- `accounts`: 사용자 인증 및 계정 관리
- `stores`: 매장 관리
- `tournaments`: 토너먼트 및 좌석 관리
- `views`: API 뷰 모듈
- `asl_holdem`: 프로젝트 설정 