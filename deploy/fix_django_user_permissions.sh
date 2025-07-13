#!/bin/bash

# Django 프로세스 사용자와 media 폴더 권한 동기화 스크립트
# 배포서버에서 Django 프로세스 사용자에 맞게 media 폴더 권한을 설정합니다

echo "🔧 Django 프로세스 사용자와 media 폴더 권한 동기화 시작..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/asl_holdem || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

echo ""
echo "=== 🔍 Django 프로세스 사용자 확인 ==="

# Django 프로세스 사용자 확인
DJANGO_USER=$(ps aux | grep -E "(gunicorn|python.*manage.py)" | grep -v grep | head -1 | awk '{print $1}')

if [ -z "$DJANGO_USER" ]; then
    echo "❌ Django 프로세스를 찾을 수 없습니다!"
    echo "Django 서비스를 먼저 시작해주세요."
    exit 1
fi

echo "🐍 Django 프로세스 사용자: $DJANGO_USER"

# 현재 사용자 확인
echo "👤 현재 사용자: $(whoami)"

# Django 프로세스 상세 정보
echo ""
echo "=== 🔄 Django 프로세스 상세 정보 ==="
ps aux | grep -E "(gunicorn|python.*manage.py)" | grep -v grep | head -5

echo ""
echo "=== 📂 현재 media 폴더 권한 상태 ==="
ls -la backend/media/

echo ""
echo "=== 🔧 권한 수정 작업 시작 ==="

# media 폴더가 없으면 생성
if [ ! -d "backend/media" ]; then
    echo "📁 media 폴더 생성 중..."
    mkdir -p backend/media
fi

# 필요한 하위 폴더들 생성
echo "📁 필요한 하위 폴더들 생성 중..."
mkdir -p backend/media/banner_images
mkdir -p backend/media/store_images
mkdir -p backend/media/qr_codes
mkdir -p backend/media/user_images

# Django 프로세스 사용자로 소유자 변경
echo "👤 media 폴더 소유자를 Django 프로세스 사용자($DJANGO_USER)로 변경 중..."
chown -R $DJANGO_USER:$DJANGO_USER backend/media/

# 권한 설정
echo "🔐 media 폴더 권한 설정 중..."
# 폴더 권한: 755 (rwxr-xr-x)
find backend/media -type d -exec chmod 755 {} \;

# 파일 권한: 644 (rw-r--r--)
find backend/media -type f -exec chmod 644 {} \;

# 웹 서버가 정적 파일에 접근할 수 있도록 추가 권한 설정
echo "🌐 웹 서버 접근 권한 설정 중..."

# www-data 사용자가 media 폴더에 읽기 권한을 가지도록 그룹 설정
if id "www-data" &>/dev/null; then
    echo "📋 www-data 그룹에 Django 사용자 추가 중..."
    usermod -a -G www-data $DJANGO_USER
    
    # media 폴더 그룹을 www-data로 설정
    chgrp -R www-data backend/media/
    
    # 그룹에 읽기 권한 부여
    chmod -R g+r backend/media/
fi

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

if [ -d "backend/media/user_images" ]; then
    echo "📁 user_images 폴더:"
    ls -ld backend/media/user_images/
fi

echo ""
echo "🧪 Django 사용자 권한 테스트 수행 중..."

# Django 사용자로 권한 테스트
TEST_FILE="backend/media/banner_images/test_django_permission.txt"
if sudo -u $DJANGO_USER touch "$TEST_FILE" 2>/dev/null; then
    echo "✅ Django 사용자 파일 생성 권한: 정상"
    
    # 파일 쓰기 테스트
    if sudo -u $DJANGO_USER sh -c "echo 'Django 사용자 권한 테스트' > '$TEST_FILE'" 2>/dev/null; then
        echo "✅ Django 사용자 파일 쓰기 권한: 정상"
        
        # 테스트 파일 삭제
        sudo -u $DJANGO_USER rm -f "$TEST_FILE"
        echo "✅ Django 사용자 파일 삭제 권한: 정상"
    else
        echo "❌ Django 사용자 파일 쓰기 권한: 실패"
    fi
else
    echo "❌ Django 사용자 파일 생성 권한: 실패"
fi

echo ""
echo "📋 추가 작업 사항:"
echo "1. Django 프로세스 재시작 필요"
echo "2. 웹 서버 재시작 권장"
echo "3. 사용자 그룹 변경 사항 적용을 위한 재로그인 필요할 수 있음"

echo ""
echo "🎯 Django 사용자 권한 동기화 완료!"

# Django 프로세스 재시작 여부 확인
echo ""
read -p "🔄 Django 프로세스를 재시작하시겠습니까? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Django 프로세스 재시작 중..."
    
    # Gunicorn 프로세스 찾기 및 종료
    GUNICORN_PIDS=$(ps aux | grep gunicorn | grep -v grep | awk '{print $2}')
    
    if [ -n "$GUNICORN_PIDS" ]; then
        echo "🛑 기존 Gunicorn 프로세스 종료 중..."
        echo $GUNICORN_PIDS | xargs kill -TERM
        sleep 2
        
        # 강제 종료가 필요한 경우
        REMAINING_PIDS=$(ps aux | grep gunicorn | grep -v grep | awk '{print $2}')
        if [ -n "$REMAINING_PIDS" ]; then
            echo "🔪 Gunicorn 프로세스 강제 종료 중..."
            echo $REMAINING_PIDS | xargs kill -KILL
        fi
    fi
    
    # Django 프로세스 재시작 (백그라운드에서)
    echo "🚀 Django 프로세스 재시작 중..."
    cd backend
    source .venv/bin/activate
    
    # Django 사용자로 Gunicorn 시작
    sudo -u $DJANGO_USER .venv/bin/gunicorn asl_holdem.wsgi:application --bind 0.0.0.0:8000 --workers 3 --daemon
    
    # 프로세스 확인
    sleep 3
    if ps aux | grep gunicorn | grep -v grep > /dev/null; then
        echo "✅ Django 프로세스 재시작 완료"
    else
        echo "❌ Django 프로세스 재시작 실패. 수동으로 재시작해주세요."
    fi
    
    # Nginx 재시작
    if systemctl is-active --quiet nginx; then
        systemctl restart nginx
        echo "✅ Nginx 서비스 재시작 완료"
    fi
fi

echo ""
echo "🎉 Django 사용자 권한 문제 해결 완료!"
echo "이제 배너 업로드를 다시 테스트해보세요." 