#!/bin/bash

# 프론트엔드 수정사항 배포 스크립트
# 사용법: 배포서버에서 ./deploy_frontend_fix.sh 실행

echo "=== ASL 홀덤 프론트엔드 수정사항 배포 시작 ==="
echo "시작 시간: $(date)"

# 1. 프로젝트 디렉토리 찾기
echo "📁 프로젝트 디렉토리 찾는 중..."
PROJECT_DIR=""

if [ -d "/var/www/asl_holdem" ]; then
    PROJECT_DIR="/var/www/asl_holdem"
elif [ -d "/var/www/ASLHoldem_web" ]; then
    PROJECT_DIR="/var/www/ASLHoldem_web"
else
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다."
    exit 1
fi

echo "✅ 프로젝트 디렉토리: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 2. Git 변경사항 가져오기
echo "📥 Git 변경사항 가져오기 중..."
git fetch origin
git reset --hard origin/master

# 3. 프론트엔드 디렉토리로 이동
echo "📁 프론트엔드 디렉토리로 이동..."
cd frontend-v1

# 4. Node.js 의존성 설치
echo "📦 Node.js 의존성 설치 중..."
npm install

# 5. 프론트엔드 빌드
echo "🔨 프론트엔드 빌드 중..."
npm run build

# 6. 빌드 결과 확인
echo "📋 빌드 결과 확인 중..."
if [ -d "dist" ]; then
    echo "✅ 빌드 성공 - dist 디렉토리 확인됨"
    ls -la dist/
else
    echo "❌ 빌드 실패 - dist 디렉토리 없음"
    exit 1
fi

# 7. 권한 설정
echo "🔒 권한 설정 중..."
chmod -R 755 dist/
chown -R www-data:www-data dist/ 2>/dev/null || chown -R $USER:$USER dist/

# 8. Nginx 설정 확인
echo "🔍 Nginx 설정 확인 중..."
nginx -t

# 9. 서비스 재시작
echo "🔄 서비스 재시작 중..."
systemctl restart nginx
supervisorctl restart all

# 10. 상태 확인
echo "📊 상태 확인 중..."
systemctl status nginx | head -5
supervisorctl status | head -5

echo ""
echo "✅ 프론트엔드 수정사항 배포 완료!"
echo "완료 시간: $(date)"
echo ""
echo "🌐 웹사이트 접속:"
echo "- HTTP: http://kasl.co.kr"
echo "- HTTPS: https://kasl.co.kr (SSL 설정 후)"
echo ""
echo "화이팅! 🚀" 