#!/bin/bash

# 배너 이미지 업로드 권한 상태 확인 스크립트
# 배포서버에서 실행하여 현재 권한 상태를 확인합니다

echo "🔍 배너 이미지 업로드 권한 상태 확인 스크립트..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/ASLHoldem_web || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

echo ""
echo "=== 📂 Media 폴더 권한 상태 ==="
if [ -d "backend/media" ]; then
    ls -la backend/media/
else
    echo "❌ backend/media 폴더가 존재하지 않습니다!"
fi

echo ""
echo "=== 🖼️ Banner Images 폴더 권한 상태 ==="
if [ -d "backend/media/banner_images" ]; then
    ls -la backend/media/banner_images/ | head -10
else
    echo "❌ backend/media/banner_images 폴더가 존재하지 않습니다!"
fi

echo ""
echo "=== 👤 현재 사용자 정보 ==="
echo "현재 사용자: $(whoami)"
echo "현재 사용자 ID: $(id)"

echo ""
echo "=== 🔄 Django 프로세스 상태 ==="
echo "실행 중인 Django 관련 프로세스:"
ps aux | grep -E "(gunicorn|uwsgi|python.*manage.py)" | grep -v grep | head -5

echo ""
echo "=== 🌐 웹서버 프로세스 상태 ==="
echo "실행 중인 웹서버 프로세스:"
ps aux | grep -E "(nginx|apache)" | grep -v grep | head -5

echo ""
echo "=== 📊 디스크 사용량 ==="
df -h | grep -E "(Filesystem|/var/www|/home)"

echo ""
echo "=== 🔒 SELinux 상태 (있는 경우) ==="
if command -v getenforce &> /dev/null; then
    echo "SELinux 상태: $(getenforce)"
    if [ "$(getenforce)" = "Enforcing" ]; then
        echo "⚠️ SELinux가 활성화되어 있습니다. 추가 설정이 필요할 수 있습니다."
    fi
else
    echo "SELinux가 설치되어 있지 않습니다."
fi

echo ""
echo "=== 🧪 권한 테스트 ==="
TEST_FILE="backend/media/banner_images/test_permission.txt"

# 테스트 파일 생성 시도
if touch "$TEST_FILE" 2>/dev/null; then
    echo "✅ 파일 생성 권한: 정상"
    
    # 파일 쓰기 시도
    if echo "test content" > "$TEST_FILE" 2>/dev/null; then
        echo "✅ 파일 쓰기 권한: 정상"
        
        # 테스트 파일 삭제
        rm -f "$TEST_FILE"
        echo "✅ 파일 삭제 권한: 정상"
    else
        echo "❌ 파일 쓰기 권한: 실패"
    fi
else
    echo "❌ 파일 생성 권한: 실패"
fi

echo ""
echo "=== 📋 권한 문제 해결 가이드 ==="
echo "권한 문제가 발견된 경우 다음 명령을 실행하세요:"
echo "1. sudo bash deploy/fix_media_permissions.sh"
echo "2. sudo systemctl restart nginx"
echo "3. sudo systemctl restart gunicorn (또는 uwsgi)"

echo ""
echo "🎯 권한 확인 완료!" 