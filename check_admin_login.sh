#!/bin/bash

# 관리자 계정 로그인 문제 진단 및 해결 스크립트

USERNAME="01000000000"
PASSWORD="admin123"

echo "======================================"
echo "ASL Holdem 관리자 로그인 문제 진단"
echo "======================================"
echo "대상 계정: $USERNAME"
echo "대상 비밀번호: $PASSWORD"
echo ""

# 배포 서버 정보
DEPLOY_SERVER="141.164.36.65"
DEPLOY_USER="root"
DEPLOY_PATH="/var/www/asl_holdem"

echo "1. 배포 서버 연결 테스트..."
if ping -c 1 $DEPLOY_SERVER >/dev/null 2>&1; then
    echo "✓ 배포 서버 연결 가능"
else
    echo "✗ 배포 서버 연결 불가"
    exit 1
fi

echo ""
echo "2. 배포 서버에서 사용자 정보 확인..."
ssh $DEPLOY_USER@$DEPLOY_SERVER << EOF
cd $DEPLOY_PATH/backend
source .venv/bin/activate

echo "Django 프로젝트 위치: \$(pwd)"
echo ""

echo "=== 사용자 정보 확인 ==="
python manage.py check_user_login $USERNAME --password $PASSWORD

echo ""
echo "=== 현재 모든 관리자 계정 목록 ==="
python manage.py shell << SHELL
from accounts.models import User
admins = User.objects.filter(role='ADMIN')
print(f"총 {admins.count()}명의 관리자 계정:")
for admin in admins:
    print(f"  - {admin.username} ({admin.first_name}) - 활성화: {admin.is_active}, 스태프: {admin.is_staff}")
SHELL

EOF

echo ""
echo "3. 문제 해결 방법 제시"
echo ""
echo "만약 위 결과에서 문제가 발견되면 다음 명령어로 해결할 수 있습니다:"
echo ""
echo "# 1. 사용자가 존재하지 않는 경우:"
echo "ssh $DEPLOY_USER@$DEPLOY_SERVER 'cd $DEPLOY_PATH/backend && source .venv/bin/activate && python manage.py fix_user_login $USERNAME --password $PASSWORD --role ADMIN --activate'"
echo ""
echo "# 2. 비밀번호가 틀린 경우:"
echo "ssh $DEPLOY_USER@$DEPLOY_SERVER 'cd $DEPLOY_PATH/backend && source .venv/bin/activate && python manage.py fix_user_login $USERNAME --password $PASSWORD'"
echo ""
echo "# 3. 권한이 없는 경우:"
echo "ssh $DEPLOY_USER@$DEPLOY_SERVER 'cd $DEPLOY_PATH/backend && source .venv/bin/activate && python manage.py fix_user_login $USERNAME --role ADMIN --sync-permissions --activate'"
echo ""
echo "# 4. 모든 문제 한번에 해결:"
echo "ssh $DEPLOY_USER@$DEPLOY_SERVER 'cd $DEPLOY_PATH/backend && source .venv/bin/activate && python manage.py fix_user_login $USERNAME --password $PASSWORD --role ADMIN --sync-permissions --activate'"
echo ""

read -p "지금 문제를 자동으로 해결하시겠습니까? (y/N): " AUTO_FIX

if [[ $AUTO_FIX =~ ^[Yy]$ ]]; then
    echo ""
    echo "4. 자동 문제 해결 실행..."
    
    ssh $DEPLOY_USER@$DEPLOY_SERVER << EOF
cd $DEPLOY_PATH/backend
source .venv/bin/activate

echo "=== 문제 해결 실행 ==="
python manage.py fix_user_login $USERNAME --password $PASSWORD --role ADMIN --sync-permissions --activate

echo ""
echo "=== 해결 후 재확인 ==="
python manage.py check_user_login $USERNAME --password $PASSWORD

echo ""
echo "=== Django 서비스 재시작 ==="
sudo systemctl restart gunicorn
sudo systemctl restart nginx

echo "✓ 서비스 재시작 완료"
EOF

    echo ""
    echo "✓ 문제 해결 완료!"
    echo ""
    echo "이제 다음 URL에서 로그인을 시도해보세요:"
    echo "http://$DEPLOY_SERVER/admin/"
    echo "사용자명: $USERNAME"
    echo "비밀번호: $PASSWORD"
    
else
    echo "자동 해결을 건너뛰었습니다."
    echo "위에 제시된 명령어를 수동으로 실행하여 문제를 해결하세요."
fi

echo ""
echo "화이팅!" 