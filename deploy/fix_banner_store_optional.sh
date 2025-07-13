#!/bin/bash

# 배너 매장 필드를 선택사항으로 만드는 마이그레이션 실행 스크립트
# 본사 관리자가 전체용 배너를 생성할 수 있도록 설정합니다

echo "🔄 배너 매장 필드 선택사항 설정 시작..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/asl_holdem || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

echo ""
echo "=== 🔍 현재 마이그레이션 상태 확인 ==="

cd backend

# 가상환경 활성화
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    echo "✅ 가상환경 활성화 완료"
else
    echo "⚠️ 가상환경을 찾을 수 없습니다. 시스템 Python을 사용합니다."
fi

# 현재 적용되지 않은 마이그레이션 확인
echo "📋 적용 대기 중인 마이그레이션:"
python manage.py showmigrations --plan | grep "\[ \]" || echo "   적용 대기 중인 마이그레이션이 없습니다."

echo ""
echo "=== 🚀 마이그레이션 실행 ==="

# 마이그레이션 실행
python manage.py migrate

if [ $? -eq 0 ]; then
    echo "✅ 마이그레이션 실행 완료"
else
    echo "❌ 마이그레이션 실행 실패"
    exit 1
fi

echo ""
echo "=== 📊 마이그레이션 결과 확인 ==="

# 마이그레이션 상태 재확인
python manage.py showmigrations stores | tail -5

echo ""
echo "=== 🧪 배너 모델 변경사항 테스트 ==="

# Django shell로 배너 모델 테스트
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from stores.models import Banner, Store
from django.contrib.auth import get_user_model

User = get_user_model()

print('=' * 50)
print('🧪 배너 모델 필드 확인')
print('=' * 50)

# 배너 모델 필드 확인
banner_fields = Banner._meta.get_fields()
store_field = Banner._meta.get_field('store')

print(f'📋 store 필드 정보:')
print(f'   - null 허용: {store_field.null}')
print(f'   - blank 허용: {store_field.blank}')
print(f'   - 필드 타입: {type(store_field).__name__}')

# 기존 배너 개수 확인
total_banners = Banner.objects.count()
banners_with_store = Banner.objects.filter(store__isnull=False).count()
banners_without_store = Banner.objects.filter(store__isnull=True).count()

print()
print(f'📊 배너 현황:')
print(f'   - 전체 배너: {total_banners}개')
print(f'   - 매장 배너: {banners_with_store}개')
print(f'   - 전체용 배너: {banners_without_store}개')

# 관리자 계정 확인
admin_users = User.objects.filter(is_staff=True).count()
store_owners = User.objects.filter(is_store_owner=True).count()

print()
print(f'👥 사용자 권한 현황:')
print(f'   - 관리자: {admin_users}명')
print(f'   - 매장관리자: {store_owners}명')

print()
print('✅ 배너 모델 변경사항 적용 완료!')
print('이제 본사 관리자가 매장을 선택하지 않고도 전체용 배너를 생성할 수 있습니다.')
"

echo ""
echo "=== 📋 추가 작업 사항 ==="
echo "1. Django 프로세스 재시작 (선택사항)"
echo "2. 웹브라우저에서 배너 생성 테스트"
echo "3. 관리자 계정으로 로그인하여 매장 선택 없이 배너 생성 시도"

echo ""
echo "🎉 배너 매장 필드 선택사항 설정 완료!"

# Django 프로세스 재시작 여부 확인
echo ""
read -p "🔄 Django 프로세스를 재시작하시겠습니까? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Django 프로세스 재시작 중..."
    
    # Gunicorn 프로세스 찾기 및 재시작
    GUNICORN_PIDS=$(ps aux | grep gunicorn | grep -v grep | awk '{print $2}')
    
    if [ -n "$GUNICORN_PIDS" ]; then
        echo "🛑 기존 Gunicorn 프로세스 재시작 중..."
        echo $GUNICORN_PIDS | xargs kill -HUP
        sleep 2
        echo "✅ Django 프로세스 재시작 완료"
    else
        echo "⚠️ 실행 중인 Gunicorn 프로세스를 찾을 수 없습니다."
    fi
fi

echo ""
echo "🎯 배너 매장 필드 선택사항 설정 완료!"
echo "본사 관리자는 이제 매장을 선택하지 않고도 전체용 배너를 생성할 수 있습니다." 