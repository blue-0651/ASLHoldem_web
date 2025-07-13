#!/bin/bash

# 배너 이미지 업로드 권한 문제 해결 스크립트
# 배포서버에서 실행하여 media 폴더 권한을 수정합니다

echo "🔧 배너 이미지 업로드 권한 수정 스크립트 시작..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/ASLHoldem_web || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

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

echo "🔐 권한 설정 중..."

# 웹서버 사용자 확인 (nginx의 경우 www-data, apache의 경우 apache 등)
WEB_USER="www-data"
if id "$WEB_USER" &>/dev/null; then
    echo "✅ 웹서버 사용자 '$WEB_USER' 확인됨"
else
    # CentOS/RHEL의 경우 apache 사용자 확인
    WEB_USER="apache"
    if id "$WEB_USER" &>/dev/null; then
        echo "✅ 웹서버 사용자 '$WEB_USER' 확인됨"
    else
        # 기본적으로 nginx 사용자 확인
        WEB_USER="nginx"
        if id "$WEB_USER" &>/dev/null; then
            echo "✅ 웹서버 사용자 '$WEB_USER' 확인됨"
        else
            echo "⚠️ 웹서버 사용자를 찾을 수 없습니다. 수동으로 설정해주세요."
            echo "   일반적인 웹서버 사용자: www-data, apache, nginx"
            WEB_USER="www-data"  # 기본값으로 설정
        fi
    fi
fi

# 폴더 소유자 변경 (root 권한 필요)
echo "👤 폴더 소유자를 '$WEB_USER'로 변경 중..."
sudo chown -R $WEB_USER:$WEB_USER backend/media/

# 폴더 권한 설정
echo "📝 폴더 권한 설정 중..."
sudo chmod -R 755 backend/media/

# 업로드된 파일들에 대한 권한 설정
echo "📄 파일 권한 설정 중..."
sudo find backend/media/ -type f -exec chmod 644 {} \;

# 특별히 banner_images 폴더 권한 확인
echo "🖼️ banner_images 폴더 권한 설정 중..."
sudo chmod 755 backend/media/banner_images/
sudo chown $WEB_USER:$WEB_USER backend/media/banner_images/

# Django 프로세스가 실행되는 사용자 확인
echo "🔍 Django 프로세스 사용자 확인 중..."
ps aux | grep -E "(gunicorn|uwsgi|python.*manage.py)" | grep -v grep | head -5

echo ""
echo "=== 수정된 권한 상태 ==="
ls -la backend/media/
echo ""
ls -la backend/media/banner_images/ | head -10

echo ""
echo "🎉 권한 수정 완료!"
echo ""
echo "📋 추가 확인사항:"
echo "1. Django 프로세스 재시작이 필요할 수 있습니다"
echo "2. 웹서버(nginx/apache) 재시작이 필요할 수 있습니다"
echo "3. SELinux가 활성화된 경우 추가 설정이 필요할 수 있습니다"
echo ""
echo "🔄 서비스 재시작 명령어:"
echo "   sudo systemctl restart nginx"
echo "   sudo systemctl restart gunicorn"
echo "   또는 sudo systemctl restart uwsgi"
echo ""
echo "📊 SELinux 확인 (있는 경우):"
echo "   sudo setsebool -P httpd_can_network_connect 1"
echo "   sudo semanage fcontext -a -t httpd_exec_t '/var/www/ASLHoldem_web/backend/media(/.*)?'"
echo "   sudo restorecon -Rv /var/www/ASLHoldem_web/backend/media/" 