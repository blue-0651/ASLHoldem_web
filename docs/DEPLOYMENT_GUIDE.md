# ASL Holdem 배포 서버 Git 업데이트 가이드

## 개요

이 문서는 로컬 개발 환경에서 배포 서버(141.164.36.65)로 Git을 통해 모든 수정사항을 안전하게 반영하는 방법을 설명합니다.

## 배포 방법

### 방법 1: 자동 배포 스크립트 (권장)

가장 간단하고 안전한 방법입니다.

```bash
# 프로젝트 루트 디렉토리에서 실행
./deploy_to_server.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
1. 로컬 Git 상태 확인
2. 원격 저장소 동기화 확인  
3. 배포 서버 연결 테스트
4. 배포 스크립트 전송
5. 배포 서버에서 자동 업데이트 실행

### 방법 2: 수동 배포

직접 제어하고 싶은 경우 사용합니다.

#### 2-1. 로컬에서 원격 저장소에 푸시

```bash
git add .
git commit -m "배포할 변경사항 설명"
git push origin master
```

#### 2-2. 배포 서버에 접속

```bash
ssh root@141.164.36.65
```

#### 2-3. 배포 서버에서 업데이트 실행

```bash
cd /var/www/asl_holdem
git pull origin master
```

#### 2-4. 웹 서비스 재시작

```bash
# 기존 프로세스 종료
pkill -f "python.*manage.py"
pkill -f "gunicorn"

# 가상환경 활성화 (백엔드 디렉토리에서)
cd backend
source .venv/bin/activate

# Django 설정 확인
python manage.py check

# 마이그레이션 적용 (필요시)
python manage.py migrate

# 웹 서비스 재시작
systemctl restart nginx
systemctl restart gunicorn  # 또는 해당 웹 서비스명
```

## 배포 스크립트 상세 기능

### deploy_to_server.sh (로컬 실행)

- **사전 검사**: 로컬 Git 상태, 원격 저장소 동기화 확인
- **연결 테스트**: 배포 서버 접근 가능성 확인
- **스크립트 전송**: 배포 스크립트를 서버에 전송
- **자동 실행**: 사용자 확인 후 원격에서 배포 스크립트 실행

### deploy_git_updates.sh (서버에서 실행)

1. **사전 검사**
   - 배포 디렉토리 존재 확인
   - Git 저장소 확인
   - 인터넷 연결 확인

2. **백업 생성**
   - 현재 backend, frontend-v1 디렉토리 백업
   - 타임스탬프로 백업 파일명 생성
   - 백업 위치: `/var/backups/asl_holdem/`

3. **Git 상태 확인**
   - 현재 브랜치 및 커밋 정보 표시
   - 로컬 변경사항 있을 경우 stash 저장

4. **Git 업데이트**
   - 원격 저장소에서 최신 변경사항 가져오기
   - 업데이트 내역 표시
   - git pull 실행

5. **파일 권한 설정**
   - 새로 추가된 스크립트 파일들 실행 권한 부여

6. **Django 설정 확인**
   - 가상환경 활성화
   - `.env` 파일 자동 생성 (없는 경우)
   - Django 설정 검증

7. **데이터베이스 마이그레이션**
   - 새로운 마이그레이션 파일 확인
   - 필요시 자동 적용

8. **새로운 관리 명령어 테스트**
   - 추가된 Django 관리 명령어들 확인
   - DB 연결 테스트

9. **웹 서비스 재시작**
   - 기존 프로세스 종료
   - 가능한 서비스들 자동 감지하여 재시작
   - Nginx 재시작

10. **배포 완료 확인**
    - 웹 서비스 상태 확인
    - 포트 사용 확인
    - 최종 Git 상태 표시

## 환경 설정

### 배포 서버 정보

- **서버 IP**: 141.164.36.65
- **사용자**: root
- **배포 경로**: /var/www/asl_holdem
- **백업 경로**: /var/backups/asl_holdem

### 데이터베이스 설정

배포 서버의 `.env` 파일이 자동으로 생성됩니다:

```env
DB_NAME=asl_db
DB_USER=asl_user
DB_PASSWORD=pppsss
DB_HOST=localhost
DB_PORT=5432
DEBUG=False
```

## 새로 추가된 기능들

배포 후 다음 기능들이 사용 가능합니다:

### Django 관리 명령어

```bash
# 사용자 로그인 상태 진단
python manage.py check_user_login <사용자명>

# 사용자 로그인 문제 해결
python manage.py fix_user_login <사용자명>

# 모든 사용자 비밀번호 1234로 통일
python manage.py reset_all_passwords

# 비밀번호 확인
python manage.py check_passwords

# 역할별 권한 동기화
python manage.py sync_user_permissions
```

### 사용자 관리 시스템

- Django admin에서 사용자 관리 가능
- 역할 변경 시 자동 권한 동기화
- 사용자 생성 시 기본 권한 자동 설정

## 문제 해결

### 배포 실패 시

1. **백업 복원**
   ```bash
   cd /var/backups/asl_holdem
   ls -la  # 백업 파일 확인
   cd /var/www/asl_holdem
   tar -xzf /var/backups/asl_holdem/backend_backup_YYYYMMDD_HHMMSS.tar.gz
   ```

2. **수동 서비스 재시작**
   ```bash
   systemctl restart nginx
   systemctl restart gunicorn
   # 또는
   pkill -f python
   cd /var/www/asl_holdem/backend
   source .venv/bin/activate
   python manage.py runserver 0.0.0.0:8000 &
   ```

### 일반적인 문제들

1. **SSH 연결 실패**
   - 서버 IP 확인: `ping 141.164.36.65`
   - SSH 키 설정 확인

2. **Git pull 실패**
   - 인터넷 연결 확인
   - GitHub 접근 권한 확인
   - 로컬 변경사항으로 인한 충돌 시 stash 사용

3. **Django 설정 오류**
   - `.env` 파일 확인
   - PostgreSQL 서비스 상태 확인: `systemctl status postgresql`

4. **권한 문제**
   - 파일 소유권 확인: `chown -R www-data:www-data /var/www/asl_holdem`
   - 실행 권한 확인: `chmod +x deploy/*.sh`

## 로그 확인

- **배포 로그**: 콘솔 출력으로 실시간 확인
- **Django 로그**: `tail -f /var/log/django/error.log`
- **Nginx 로그**: `tail -f /var/log/nginx/error.log`
- **시스템 로그**: `journalctl -f -u your-service-name`

## 보안 고려사항

1. **백업 파일 정리**
   - 정기적으로 오래된 백업 파일 삭제
   - 백업 파일 접근 권한 제한

2. **환경 변수 보안**
   - `.env` 파일 권한 확인: `chmod 600 .env`
   - 민감한 정보는 환경 변수로 관리

3. **Git 보안**
   - SSH 키 기반 인증 사용
   - HTTPS보다 SSH 프로토콜 권장

## 자주 사용하는 명령어

```bash
# 빠른 배포 (권장)
./deploy_to_server.sh

# 배포 서버 상태 확인
ssh root@141.164.36.65 "cd /var/www/asl_holdem && git status && systemctl status nginx"

# 백업 목록 확인  
ssh root@141.164.36.65 "ls -la /var/backups/asl_holdem/"

# 새로운 관리 명령어 실행
ssh root@141.164.36.65 "cd /var/www/asl_holdem/backend && source .venv/bin/activate && python manage.py help"
```

---

**화이팅!** 🚀

이 가이드를 통해 안전하고 효율적인 배포를 진행하세요! 