# 관리자 로그인 문제 해결 가이드

## 문제 상황
- 배포 서버에서 계정 `01000000000`, 비밀번호 `admin123`으로 관리자 로그인이 안됨

## 해결 단계

### 1단계: 배포 서버 접속
```bash
ssh root@141.164.36.65
```

### 2단계: Django 프로젝트 디렉토리로 이동
```bash
cd /var/www/asl_holdem/backend
source .venv/bin/activate
```

### 3단계: 현재 상태 확인
```bash
python manage.py check_user_login 01000000000 --password admin123
```

### 4단계: 문제 해결
```bash
# 모든 문제 한번에 해결
python manage.py fix_user_login 01000000000 --password admin123 --role ADMIN --sync-permissions --activate
```

### 5단계: 해결 후 재확인
```bash
python manage.py check_user_login 01000000000 --password admin123
```

### 6단계: 서비스 재시작
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### 7단계: 웹 브라우저에서 로그인 테스트
- URL: http://141.164.36.65/admin/
- 사용자명: 01000000000
- 비밀번호: admin123

## 한번에 실행하는 명령어

로컬에서 다음 명령어를 실행하면 모든 단계를 한번에 처리할 수 있습니다:

```bash
ssh root@141.164.36.65 '
cd /var/www/asl_holdem/backend
source .venv/bin/activate
echo "=== 현재 상태 확인 ==="
python manage.py check_user_login 01000000000 --password admin123
echo ""
echo "=== 문제 해결 ==="
python manage.py fix_user_login 01000000000 --password admin123 --role ADMIN --sync-permissions --activate
echo ""
echo "=== 해결 후 재확인 ==="
python manage.py check_user_login 01000000000 --password admin123
echo ""
echo "=== 서비스 재시작 ==="
sudo systemctl restart gunicorn
sudo systemctl restart nginx
echo "✓ 완료!"
'
```

## 주요 문제 유형별 해결방법

### 1. 사용자가 존재하지 않는 경우
```bash
python manage.py fix_user_login 01000000000 --password admin123 --role ADMIN --activate
```

### 2. 비밀번호가 틀린 경우
```bash
python manage.py fix_user_login 01000000000 --password admin123
```

### 3. 권한이 없는 경우
```bash
python manage.py fix_user_login 01000000000 --role ADMIN --sync-permissions --activate
```

### 4. 사용자가 비활성화된 경우
```bash
python manage.py fix_user_login 01000000000 --activate
```

## 확인 명령어들

### 현재 모든 관리자 목록 확인
```bash
python manage.py shell -c "
from accounts.models import User
admins = User.objects.filter(role='ADMIN')
print(f'총 {admins.count()}명의 관리자 계정:')
for admin in admins:
    print(f'  - {admin.username} ({admin.first_name}) - 활성화: {admin.is_active}, 스태프: {admin.is_staff}')
"
```

### 특정 사용자 상세 정보 확인
```bash
python manage.py check_user_login [사용자명] --password [비밀번호]
```

## 문제가 계속 발생하는 경우

1. Django 로그 확인:
```bash
sudo journalctl -u gunicorn -f
```

2. Nginx 로그 확인:
```bash
sudo tail -f /var/log/nginx/error.log
```

3. Django 설정 확인:
```bash
python manage.py check
```

4. 데이터베이스 연결 확인:
```bash
python manage.py dbshell
```

---

**참고**: 모든 명령어는 배포 서버(`141.164.36.65`)에서 가상환경(`.venv`)을 활성화한 상태에서 실행해야 합니다.

화이팅! 🚀 