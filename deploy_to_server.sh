#!/bin/bash

# 로컬에서 배포 서버로 Git 업데이트 배포 스크립트

DEPLOY_SERVER="141.164.36.65"
DEPLOY_USER="root"
DEPLOY_PATH="/var/www/asl_holdem"

echo "======================================"
echo "ASL Holdem 배포 서버 Git 업데이트"
echo "======================================"
echo "대상 서버: $DEPLOY_SERVER"
echo "배포 경로: $DEPLOY_PATH"
echo ""

# 1단계: 로컬 Git 상태 확인
echo "1. 로컬 Git 상태 확인..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  로컬에 커밋되지 않은 변경사항이 있습니다:"
    git status --short
    echo ""
    read -p "먼저 로컬 변경사항을 커밋하시겠습니까? (y/N): " COMMIT_LOCAL
    if [[ $COMMIT_LOCAL =~ ^[Yy]$ ]]; then
        echo "git add와 git commit을 수동으로 실행하신 후 다시 실행해주세요."
        exit 1
    fi
fi

echo "✓ 로컬 Git 상태: $(git log --oneline -1)"

# 2단계: 원격 저장소에 푸시 확인
echo ""
echo "2. 원격 저장소 동기화 확인..."
git fetch origin

if [ -n "$(git log --oneline origin/master..HEAD)" ]; then
    echo "⚠️  로컬 커밋이 원격 저장소에 푸시되지 않았습니다:"
    git log --oneline origin/master..HEAD
    echo ""
    read -p "지금 원격 저장소에 푸시하시겠습니까? (y/N): " PUSH_NOW
    if [[ $PUSH_NOW =~ ^[Yy]$ ]]; then
        git push origin master
        echo "✓ 원격 저장소 푸시 완료"
    else
        echo "❌ 원격 저장소 푸시가 필요합니다. 먼저 'git push origin master'를 실행해주세요."
        exit 1
    fi
else
    echo "✓ 원격 저장소와 동기화되어 있습니다."
fi

# 3단계: 서버 연결 테스트
echo ""
echo "3. 배포 서버 연결 테스트..."
if ping -c 1 $DEPLOY_SERVER >/dev/null 2>&1; then
    echo "✓ 배포 서버 연결 가능"
else
    echo "❌ 배포 서버 연결 불가: $DEPLOY_SERVER"
    exit 1
fi

# 4단계: 배포 스크립트 전송
echo ""
echo "4. 배포 스크립트 전송..."
scp deploy/deploy_git_updates.sh $DEPLOY_USER@$DEPLOY_SERVER:$DEPLOY_PATH/
echo "✓ 배포 스크립트 전송 완료"

# 5단계: 배포 서버에서 실행 여부 확인
echo ""
echo "5. 배포 실행 확인"
echo "전송할 업데이트 내역:"
git log --oneline origin/master~5..origin/master
echo ""

read -p "배포 서버에서 Git 업데이트를 실행하시겠습니까? (y/N): " EXECUTE_DEPLOY

if [[ $EXECUTE_DEPLOY =~ ^[Yy]$ ]]; then
    echo ""
    echo "6. 배포 서버에서 Git 업데이트 실행..."
    echo "========================================="
    
    ssh $DEPLOY_USER@$DEPLOY_SERVER << EOF
cd $DEPLOY_PATH
chmod +x deploy_git_updates.sh
./deploy_git_updates.sh
EOF

    echo "========================================="
    echo ""
    
    if [ $? -eq 0 ]; then
        echo "✅ 배포가 성공적으로 완료되었습니다!"
        echo ""
        echo "확인 사항:"
        echo "1. 웹사이트: http://$DEPLOY_SERVER/"
        echo "2. 관리자 페이지: http://$DEPLOY_SERVER/admin/"
        echo ""
        echo "새로 추가된 기능들:"
        echo "- 사용자 관리 시스템"
        echo "- 로그인 문제 해결 도구"
        echo "- 비밀번호 관리 명령어"
        echo "- 권한 동기화 시스템"
    else
        echo "❌ 배포 중 오류가 발생했습니다."
        echo "배포 서버에 직접 접속하여 확인해주세요:"
        echo "ssh $DEPLOY_USER@$DEPLOY_SERVER"
    fi
else
    echo ""
    echo "📋 수동 배포 명령어:"
    echo "배포 서버에 SSH 접속 후 다음 명령어를 실행하세요:"
    echo ""
    echo "ssh $DEPLOY_USER@$DEPLOY_SERVER"
    echo "cd $DEPLOY_PATH"
    echo "./deploy_git_updates.sh"
fi

echo ""
echo "화이팅! 🚀" 