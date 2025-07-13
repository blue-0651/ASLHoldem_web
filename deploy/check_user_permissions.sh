#!/bin/bash

# 사용자 권한 상태 확인 스크립트
# 배포서버에서 실행하여 현재 로그인 가능한 사용자들의 권한을 확인합니다

echo "🔍 사용자 권한 상태 확인 스크립트..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/asl_holdem || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

echo ""
echo "=== 📋 전체 사용자 권한 상태 확인 ==="

# Django shell 명령어로 사용자 권한 확인
cd backend

python3 -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

print('=' * 60)
print('📊 사용자 권한 현황')
print('=' * 60)

users = User.objects.all().order_by('id')
print(f'총 사용자 수: {users.count()}명\n')

for user in users:
    print(f'📱 ID: {user.id} | 전화번호: {user.phone}')
    print(f'👤 닉네임: {user.nickname or \"없음\"}')
    print(f'📧 이메일: {user.email or \"없음\"}')
    print(f'🏷️  역할: {user.role} ({user.get_role_display()})')
    print(f'⚡ 활성 상태: {\"✅\" if user.is_active else \"❌\"} {user.is_active}')
    print(f'👑 관리자: {\"✅\" if user.is_staff else \"❌\"} is_staff={user.is_staff}')
    print(f'🔱 슈퍼유저: {\"✅\" if user.is_superuser else \"❌\"} is_superuser={user.is_superuser}')
    print(f'🏪 매장관리자: {\"✅\" if user.is_store_owner else \"❌\"} is_store_owner={user.is_store_owner}')
    
    # 배너 생성 권한 확인
    can_create_banner = user.is_staff or user.is_superuser or user.is_store_owner
    print(f'🎯 배너 생성 권한: {\"✅ 가능\" if can_create_banner else \"❌ 불가능\"}')
    
    print(f'📅 가입일: {user.date_joined.strftime(\"%Y-%m-%d %H:%M\")}')
    print(f'🔑 최근 로그인: {user.last_login.strftime(\"%Y-%m-%d %H:%M\") if user.last_login else \"없음\"}')
    print('-' * 60)

print()
print('=' * 60)
print('📈 권한별 통계')
print('=' * 60)

total_users = users.count()
admin_users = users.filter(is_staff=True).count()
superusers = users.filter(is_superuser=True).count()
store_owners = users.filter(is_store_owner=True).count()
active_users = users.filter(is_active=True).count()

print(f'📊 전체 사용자: {total_users}명')
print(f'⚡ 활성 사용자: {active_users}명')
print(f'👑 관리자 (is_staff): {admin_users}명')
print(f'🔱 슈퍼유저 (is_superuser): {superusers}명')
print(f'🏪 매장관리자 (is_store_owner): {store_owners}명')

banner_creators = users.filter(models.Q(is_staff=True) | models.Q(is_superuser=True) | models.Q(is_store_owner=True)).count()
print(f'🎯 배너 생성 가능 사용자: {banner_creators}명')

print()
print('=' * 60)
print('🔍 배너 생성 권한 상세 분석')
print('=' * 60)

banner_users = users.filter(models.Q(is_staff=True) | models.Q(is_superuser=True) | models.Q(is_store_owner=True))

if banner_users.exists():
    print('✅ 배너 생성 가능한 사용자들:')
    for user in banner_users:
        permissions = []
        if user.is_staff: permissions.append('관리자')
        if user.is_superuser: permissions.append('슈퍼유저')
        if user.is_store_owner: permissions.append('매장관리자')
        
        print(f'  📱 {user.phone} ({user.nickname or \"닉네임없음\"}) - {\" + \".join(permissions)}')
else:
    print('❌ 배너 생성 가능한 사용자가 없습니다!')

print()

# 매장 정보 확인
from stores.models import Store
stores = Store.objects.all()

print('=' * 60)
print('🏪 매장 정보')
print('=' * 60)
print(f'등록된 매장 수: {stores.count()}개')

for store in stores:
    print(f'🏪 매장명: {store.name}')
    print(f'👤 소유자: {store.owner.phone} ({store.owner.nickname or \"닉네임없음\"})')
    print(f'📍 주소: {store.address}')
    print(f'📊 상태: {store.get_status_display()}')
    print('-' * 40)

print()
print('🎯 배너 생성 권한 문제 해결 방법:')
print('1. 사용자를 관리자로 설정: python manage.py shell')
print('2. 사용자를 매장관리자로 설정: python manage.py shell')
print('3. 권한 동기화 명령어 실행: python manage.py sync_user_permissions')
"

echo ""
echo "✅ 사용자 권한 상태 확인 완료!" 