#!/bin/bash

# 관리자 계정 권한 수정 스크립트
# 01000000000 계정을 관리자로 설정하여 배너 생성 권한 문제를 해결합니다

echo "👑 관리자 계정 권한 수정 스크립트 시작..."

# 현재 디렉토리 확인
echo "📍 현재 디렉토리: $(pwd)"

# 프로젝트 루트로 이동
cd /var/www/asl_holdem || { echo "❌ 프로젝트 디렉토리로 이동 실패"; exit 1; }

echo ""
echo "=== 🔍 01000000000 계정 권한 확인 ==="

# Django shell 명령어로 사용자 권한 확인 및 수정
cd backend

python3 -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# 목표 계정 정보
target_phone = '01000000000'
target_password = '1234'

print('=' * 60)
print('🔍 01000000000 계정 상태 확인')
print('=' * 60)

try:
    user = User.objects.get(phone=target_phone)
    print(f'✅ 계정 발견: {user.phone}')
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
    
    # 비밀번호 확인
    password_check = user.check_password(target_password)
    print(f'🔑 비밀번호 확인: {\"✅ 일치\" if password_check else \"❌ 불일치\"}')
    
    print()
    print('=' * 60)
    print('🔧 관리자 권한 설정')
    print('=' * 60)
    
    # 권한 업데이트 필요 여부 확인
    needs_update = False
    updates = []
    
    if not user.is_active:
        user.is_active = True
        updates.append('활성화')
        needs_update = True
    
    if not user.is_staff:
        user.is_staff = True
        updates.append('관리자 권한 부여')
        needs_update = True
    
    if not user.is_superuser:
        user.is_superuser = True
        updates.append('슈퍼유저 권한 부여')
        needs_update = True
    
    if user.role != 'ADMIN':
        user.role = 'ADMIN'
        updates.append('역할을 ADMIN으로 변경')
        needs_update = True
    
    # 비밀번호 확인 및 설정
    if not password_check:
        user.set_password(target_password)
        updates.append('비밀번호 재설정')
        needs_update = True
    
    if needs_update:
        user.save()
        print(f'✅ 계정 업데이트 완료:')
        for update in updates:
            print(f'   - {update}')
    else:
        print('✅ 이미 올바른 관리자 권한을 가지고 있습니다.')
    
    print()
    print('=' * 60)
    print('📊 업데이트 후 권한 상태')
    print('=' * 60)
    
    # 업데이트 후 상태 재확인
    user.refresh_from_db()
    print(f'📱 전화번호: {user.phone}')
    print(f'👤 닉네임: {user.nickname or \"없음\"}')
    print(f'🏷️  역할: {user.role} ({user.get_role_display()})')
    print(f'⚡ 활성 상태: {\"✅\" if user.is_active else \"❌\"} {user.is_active}')
    print(f'👑 관리자: {\"✅\" if user.is_staff else \"❌\"} is_staff={user.is_staff}')
    print(f'🔱 슈퍼유저: {\"✅\" if user.is_superuser else \"❌\"} is_superuser={user.is_superuser}')
    print(f'🏪 매장관리자: {\"✅\" if user.is_store_owner else \"❌\"} is_store_owner={user.is_store_owner}')
    
    # 최종 배너 생성 권한 확인
    final_can_create = user.is_staff or user.is_superuser or user.is_store_owner
    print(f'🎯 배너 생성 권한: {\"✅ 가능\" if final_can_create else \"❌ 불가능\"}')
    
    # 비밀번호 재확인
    final_password_check = user.check_password(target_password)
    print(f'🔑 비밀번호 확인: {\"✅ 일치\" if final_password_check else \"❌ 불일치\"}')
    
except User.DoesNotExist:
    print(f'❌ {target_phone} 계정을 찾을 수 없습니다.')
    print('새 관리자 계정을 생성합니다...')
    
    # 새 관리자 계정 생성
    user = User.objects.create_user(
        username=target_phone,
        phone=target_phone,
        password=target_password,
        is_staff=True,
        is_superuser=True,
        is_active=True,
        role='ADMIN',
        nickname='시스템관리자',
        email='admin@asl.co.kr'
    )
    
    print(f'✅ 새 관리자 계정 생성 완료: {user.phone}')
    print(f'👑 관리자 권한: {user.is_staff}')
    print(f'🔱 슈퍼유저 권한: {user.is_superuser}')
    print(f'🎯 배너 생성 권한: 가능')

except Exception as e:
    print(f'❌ 오류 발생: {str(e)}')
    import traceback
    traceback.print_exc()

print()
print('=' * 60)
print('🎉 관리자 권한 설정 완료!')
print('=' * 60)
print('이제 다음 작업을 수행하세요:')
print('1. 웹브라우저에서 로그아웃 후 다시 로그인')
print('2. 배너 생성 기능 테스트')
print('3. 필요시 브라우저 캐시 삭제')
"

echo ""
echo "✅ 관리자 권한 설정 완료!"

# 추가 권장사항
echo ""
echo "📋 추가 권장사항:"
echo "1. 브라우저에서 완전히 로그아웃 후 다시 로그인"
echo "2. 브라우저 캐시 및 쿠키 삭제"
echo "3. 시크릿 모드에서 로그인 테스트"
echo "4. 배너 생성 기능 재시도"

echo ""
echo "🎯 관리자 계정 권한 수정 완료!" 