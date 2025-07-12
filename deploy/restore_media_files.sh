#!/bin/bash

# 미디어 파일 복원 스크립트
# 사용법: 배포서버에서 ./restore_media_files.sh 실행

echo "=== ASL 홀덤 미디어 파일 복원 시작 ==="
echo "시작 시간: $(date)"

# 1. 프로젝트 디렉토리 찾기
echo "📁 프로젝트 디렉토리 찾는 중..."
PROJECT_DIR=""

if [ -d "/var/www/asl_holdem" ]; then
    PROJECT_DIR="/var/www/asl_holdem"
elif [ -d "/var/www/ASLHoldem_web" ]; then
    PROJECT_DIR="/var/www/ASLHoldem_web"
elif [ -d "/root/ASLHoldem_web" ]; then
    PROJECT_DIR="/root/ASLHoldem_web"
elif [ -d "/home/ASLHoldem_web" ]; then
    PROJECT_DIR="/home/ASLHoldem_web"
else
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다."
    echo "현재 디렉토리에서 계속 진행합니다: $(pwd)"
    PROJECT_DIR=$(pwd)
fi

echo "✅ 프로젝트 디렉토리: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 2. 백엔드 디렉토리로 이동
echo "📁 백엔드 디렉토리로 이동..."
cd backend

# 3. 기존 미디어 파일 백업
echo "🔄 기존 미디어 파일 백업 중..."
if [ -d "media" ]; then
    cp -r media media.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 기존 미디어 파일 백업 완료"
fi

# 4. 미디어 파일 압축 해제
echo "📦 미디어 파일 압축 해제 중..."
if [ -f "/tmp/media_files.tar.gz" ]; then
    tar -xzf /tmp/media_files.tar.gz
    echo "✅ 미디어 파일 압축 해제 완료"
else
    echo "❌ 미디어 파일을 찾을 수 없습니다: /tmp/media_files.tar.gz"
    exit 1
fi

# 5. 미디어 디렉토리 권한 설정
echo "🔒 미디어 디렉토리 권한 설정 중..."
chmod -R 755 media/
chown -R www-data:www-data media/ 2>/dev/null || chown -R $USER:$USER media/

# 6. 미디어 파일 확인
echo "📋 미디어 파일 확인 중..."
echo "📁 미디어 디렉토리 구조:"
find media -type d | head -10

echo ""
echo "📄 배너 이미지 파일들:"
ls -la media/banner_images/ | head -5

echo ""
echo "📄 QR 코드 파일들:"
ls -la media/qr_codes/ | head -5

# 7. 디스크 사용량 확인
echo ""
echo "💾 미디어 디렉토리 사용량:"
du -sh media/

# 8. 서버 재시작
echo ""
echo "🔄 서버 재시작 중..."
systemctl restart gunicorn 2>/dev/null || echo "⚠️  gunicorn 재시작 실패 - 수동으로 재시작하세요"
systemctl restart nginx 2>/dev/null || echo "⚠️  nginx 재시작 실패 - 수동으로 재시작하세요"

echo ""
echo "🎉 미디어 파일 복원 완료!"
echo "완료 시간: $(date)"
echo ""
echo "✅ 확인 사항:"
echo "1. 웹 애플리케이션에서 배너 이미지 확인"
echo "2. 관리자 페이지에서 배너 관리 확인"
echo "3. 사용자 QR 코드 페이지 확인"
echo ""
echo "화이팅! 🚀" 