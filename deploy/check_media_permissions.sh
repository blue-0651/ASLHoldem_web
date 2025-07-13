#!/bin/bash

# 배너 이미지 업로드 권한 상태 확인 스크립트
# 배포서버에서 실행하여 현재 권한 상태를 확인합니다

echo "🔍 배너 이미지 업로드 권한 상태 확인 스크립트..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/asl_holdem || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

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
ps aux | grep -E "(gunicorn|uwsgi|python.*manage.py)" | grep -v grep

echo ""
echo "=== 🌐 Web 서버 상태 ==="
echo "실행 중인 웹 서버:"
ps aux | grep -E "(nginx|apache)" | grep -v grep

echo ""
echo "=== 🔧 권한 진단 ==="
echo "backend/media 폴더 소유자 및 권한:"
if [ -d "backend/media" ]; then
    ls -ld backend/media/
    
    echo ""
    echo "media 폴더 내용 권한:"
    find backend/media -type d -exec ls -ld {} \; 2>/dev/null | head -5
    
    echo ""
    echo "쓰기 권한 테스트:"
    if [ -w "backend/media" ]; then
        echo "✅ backend/media 폴더에 쓰기 권한이 있습니다."
    else
        echo "❌ backend/media 폴더에 쓰기 권한이 없습니다!"
    fi
    
    if [ -d "backend/media/banner_images" ]; then
        if [ -w "backend/media/banner_images" ]; then
            echo "✅ backend/media/banner_images 폴더에 쓰기 권한이 있습니다."
        else
            echo "❌ backend/media/banner_images 폴더에 쓰기 권한이 없습니다!"
        fi
    fi
else
    echo "❌ backend/media 폴더가 존재하지 않습니다!"
fi

echo ""
echo "=== 🔐 권한 권장사항 ==="
echo "1. media 폴더 소유자: www-data (또는 웹 서버 사용자)"
echo "2. media 폴더 권한: 755 (rwxr-xr-x)"
echo "3. media 파일 권한: 644 (rw-r--r--)"
echo ""
echo "권한 문제가 발견되면 다음 명령어로 수정하세요:"
echo "sudo bash deploy/fix_media_permissions.sh"

echo ""
echo "✅ 권한 상태 확인 완료!" 