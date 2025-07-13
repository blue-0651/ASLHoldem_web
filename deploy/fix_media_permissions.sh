#!/bin/bash

# 배너 이미지 업로드 권한 문제 해결 스크립트
# 배포서버에서 실행하여 media 폴더 권한을 수정합니다

echo "🔧 배너 이미지 업로드 권한 수정 스크립트 시작..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/asl_holdem || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

echo "📂 백엔드 media 폴더 권한 확인 중..."

# 현재 권한 상태 확인
echo "=== 현재 권한 상태 ==="
ls -la backend/media/
echo ""

# media 폴더가 없으면 생성
if [ ! -d "backend/media" ]; then
    echo "📁 media 폴더 생성 중..."
    mkdir -p backend/media
fi

# banner_images 폴더가 없으면 생성
if [ ! -d "backend/media/banner_images" ]; then
    echo "📁 banner_images 폴더 생성 중..."
    mkdir -p backend/media/banner_images
fi

# store_images 폴더가 없으면 생성
if [ ! -d "backend/media/store_images" ]; then
    echo "📁 store_images 폴더 생성 중..."
    mkdir -p backend/media/store_images
fi

# qr_codes 폴더가 없으면 생성
if [ ! -d "backend/media/qr_codes" ]; then
    echo "📁 qr_codes 폴더 생성 중..."
    mkdir -p backend/media/qr_codes
fi

# user_images 폴더가 없으면 생성
if [ ! -d "backend/media/user_images" ]; then
    echo "📁 user_images 폴더 생성 중..."
    mkdir -p backend/media/user_images
fi

echo ""
echo "🔑 소유자 및 권한 설정 중..."

# 웹 서버 사용자 확인
WEB_USER="www-data"
if id "$WEB_USER" &>/dev/null; then
    echo "✅ 웹 서버 사용자 ($WEB_USER) 확인됨"
else
    echo "⚠️ www-data 사용자가 없습니다. nginx 사용자로 시도..."
    WEB_USER="nginx"
    if ! id "$WEB_USER" &>/dev/null; then
        echo "⚠️ nginx 사용자도 없습니다. apache 사용자로 시도..."
        WEB_USER="apache"
        if ! id "$WEB_USER" &>/dev/null; then
            echo "⚠️ 표준 웹 서버 사용자를 찾을 수 없습니다. 현재 사용자 권한으로 설정합니다."
            WEB_USER=$(whoami)
        fi
    fi
fi

echo "🔄 현재 사용자: $(whoami)"
echo "🌐 웹 서버 사용자: $WEB_USER"

# 소유자 변경
echo "📋 media 폴더 소유자를 $WEB_USER:$WEB_USER로 변경 중..."
chown -R $WEB_USER:$WEB_USER backend/media/

# 권한 설정
echo "🔐 media 폴더 권한 설정 중..."
# 폴더 권한: 755 (rwxr-xr-x) - 소유자는 읽기,쓰기,실행 / 그룹과 기타는 읽기,실행
find backend/media -type d -exec chmod 755 {} \;

# 파일 권한: 644 (rw-r--r--) - 소유자는 읽기,쓰기 / 그룹과 기타는 읽기만
find backend/media -type f -exec chmod 644 {} \;

echo ""
echo "=== 권한 설정 완료 후 상태 ==="
ls -la backend/media/

echo ""
echo "=== 하위 폴더 권한 확인 ==="
if [ -d "backend/media/banner_images" ]; then
    echo "📁 banner_images 폴더:"
    ls -ld backend/media/banner_images/
fi

if [ -d "backend/media/store_images" ]; then
    echo "📁 store_images 폴더:"
    ls -ld backend/media/store_images/
fi

if [ -d "backend/media/qr_codes" ]; then
    echo "📁 qr_codes 폴더:"
    ls -ld backend/media/qr_codes/
fi

echo ""
echo "🧪 권한 테스트 수행 중..."

# 테스트 파일 생성
TEST_FILE="backend/media/banner_images/test_permission.txt"
if touch "$TEST_FILE" 2>/dev/null; then
    echo "✅ 파일 생성 권한: 정상"
    
    # 파일 쓰기 테스트
    if echo "권한 테스트 내용" > "$TEST_FILE" 2>/dev/null; then
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
echo "📋 추가 권장사항:"
echo "1. Django 서비스 재시작: sudo systemctl restart gunicorn"
echo "2. 웹 서버 재시작: sudo systemctl restart nginx"
echo "3. 방화벽 설정 확인: sudo ufw status"

echo ""
echo "🎯 권한 수정 완료! 이제 배너 업로드를 테스트해보세요."

# 서비스 재시작 여부 확인
echo ""
read -p "🔄 Django 서비스를 재시작하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Django 서비스 재시작 중..."
    
    # Gunicorn 서비스가 있는지 확인
    if systemctl is-active --quiet gunicorn; then
        systemctl restart gunicorn
        echo "✅ Gunicorn 서비스 재시작 완료"
    else
        echo "⚠️ Gunicorn 서비스를 찾을 수 없습니다."
    fi
    
    # Nginx 서비스가 있는지 확인
    if systemctl is-active --quiet nginx; then
        systemctl restart nginx
        echo "✅ Nginx 서비스 재시작 완료"
    else
        echo "⚠️ Nginx 서비스를 찾을 수 없습니다."
    fi
fi

echo ""
echo "🎉 배너 업로드 권한 문제 해결 완료!" 