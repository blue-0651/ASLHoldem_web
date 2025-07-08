#!/bin/bash

# 관리자 로그인 문제 해결 기능 배포 스크립트

DEPLOY_SERVER="141.164.36.65"
DEPLOY_USER="root"
DEPLOY_PATH="/var/www/asl_holdem"

echo "======================================"
echo "관리자 로그인 문제 해결 기능 배포"
echo "======================================"

echo "1. 새로운 관리 명령어들을 배포 서버에 전송..."

# check_user_login.py 전송
echo "  - check_user_login.py 전송..."
scp backend/accounts/management/commands/check_user_login.py $DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH/backend/accounts/management/commands/

# fix_user_login.py 전송
echo "  - fix_user_login.py 전송..."
scp backend/accounts/management/commands/fix_user_login.py $DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH/backend/accounts/management/commands/

echo ""
echo "2. 배포 서버에서 실행할 명령어들:"
echo ""
echo "# 배포 서버에 SSH 접속:"
echo "ssh $DEPLOY_USER@$DEPLOY_SERVER"
echo ""
echo "# Django 프로젝트 디렉토리로 이동:"
echo "cd $DEPLOY_PATH/backend"
echo ""
echo "# 가상환경 활성화:"
echo "source .venv/bin/activate"
echo ""
echo "# 1단계: 현재 상태 확인"
echo "python manage.py check_user_login 01000000000 --password admin123"
echo ""
echo "# 2단계: 문제 해결 (모든 문제 한번에 해결)"
echo "python manage.py fix_user_login 01000000000 --password admin123 --role ADMIN --sync-permissions --activate"
echo ""
echo "# 3단계: 해결 후 재확인"
echo "python manage.py check_user_login 01000000000 --password admin123"
echo ""
echo "# 4단계: 서비스 재시작"
echo "sudo systemctl restart gunicorn"
echo "sudo systemctl restart nginx"
echo ""
echo "# 5단계: 현재 모든 관리자 목록 확인"
echo "python manage.py shell -c \""
echo "from accounts.models import User"
echo "admins = User.objects.filter(role='ADMIN')"
echo "print(f'총 {admins.count()}명의 관리자 계정:')"
echo "for admin in admins:"
echo "    print(f'  - {admin.username} ({admin.first_name}) - 활성화: {admin.is_active}, 스태프: {admin.is_staff}')"
echo "\""
echo ""

echo "======================================"
echo "간단 실행 명령어 (복사해서 사용하세요)"
echo "======================================"
echo ""
echo "# 한번에 실행할 수 있는 명령어:"
cat << 'EOF'
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
EOF

echo ""
echo "화이팅!" 