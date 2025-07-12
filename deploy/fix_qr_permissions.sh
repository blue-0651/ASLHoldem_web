#!/bin/bash

# QR 코드 파일 권한 문제 해결 스크립트
# 사용법: ./deploy/fix_qr_permissions.sh

echo "=== QR 코드 파일 권한 문제 해결 스크립트 ==="
echo "시작 시간: $(date)"

# 현재 디렉토리 확인
if [ ! -d "backend" ]; then
    echo "❌ 오류: 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

cd backend

# 미디어 디렉토리 생성 및 권한 설정
echo "📁 미디어 디렉토리 권한 설정 중..."

# 디렉토리 생성
mkdir -p media/qr_codes

# 소유자 변경 (웹 서버 사용자로 변경)
# Ubuntu/Debian: www-data, CentOS/RHEL: apache 또는 nginx
if id "www-data" &>/dev/null; then
    echo "www-data 사용자로 소유자 변경 중..."
    sudo chown -R www-data:www-data media/
elif id "apache" &>/dev/null; then
    echo "apache 사용자로 소유자 변경 중..."
    sudo chown -R apache:apache media/
elif id "nginx" &>/dev/null; then
    echo "nginx 사용자로 소유자 변경 중..."
    sudo chown -R nginx:nginx media/
else
    echo "⚠️  웹 서버 사용자를 찾을 수 없습니다. 현재 사용자로 설정합니다."
    sudo chown -R $USER:$USER media/
fi

# 권한 설정
echo "📝 파일 권한 설정 중..."
sudo chmod -R 755 media/
sudo chmod -R 755 media/qr_codes/

# 기존 QR 코드 파일들 권한 수정
if [ -d "media/qr_codes" ] && [ "$(ls -A media/qr_codes)" ]; then
    echo "🔄 기존 QR 코드 파일 권한 수정 중..."
    sudo chmod 644 media/qr_codes/*.png 2>/dev/null || true
fi

# SELinux 설정 (CentOS/RHEL 시스템)
if command -v getenforce &> /dev/null; then
    if [ "$(getenforce)" != "Disabled" ]; then
        echo "🔒 SELinux 컨텍스트 설정 중..."
        sudo setsebool -P httpd_can_network_connect 1
        sudo chcon -R -t httpd_exec_t media/
        sudo setsebool -P httpd_read_user_content 1
    fi
fi

echo ""
echo "📋 현재 미디어 디렉토리 상태:"
ls -la media/
echo ""
echo "📋 QR 코드 디렉토리 상태:"
ls -la media/qr_codes/ 2>/dev/null || echo "QR 코드 파일이 없습니다."

echo ""
echo "✅ 권한 설정 완료!"
echo "완료 시간: $(date)"
echo ""
echo "📝 다음 단계:"
echo "1. 웹 서버 재시작: sudo systemctl restart nginx (또는 apache2)"
echo "2. Django 서버 재시작 (gunicorn 사용 시): sudo systemctl restart gunicorn"
echo "3. 사용자 앱에서 QR 코드 페이지 테스트"
echo ""
echo "❓ 여전히 문제가 있다면 다음을 확인하세요:"
echo "   - 웹 서버(nginx/apache) 설정에서 /media/ 경로 처리"
echo "   - Django settings.py의 MEDIA_URL과 MEDIA_ROOT 설정"
echo "   - 방화벽 설정"
echo ""
echo "화이팅! 🚀" 