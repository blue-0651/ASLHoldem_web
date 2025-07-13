#!/usr/bin/env python
"""
배포서버에서 사용자 권한을 확인하고 수정하는 스크립트
사용법: 
  python check_user_permissions.py                     # 모든 사용자 권한 확인
  python check_user_permissions.py 010-0000-0000      # 특정 사용자 권한 확인
  python check_user_permissions.py 010-0000-0000 fix  # 특정 사용자 권한 수정
"""

import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from accounts.models import User
from django.contrib.auth.hashers import make_password

def check_user_permissions(phone_number=None):
    """사용자 권한 확인"""
    print("=" * 60)
    print("🔍 사용자 권한 확인")
    print("=" * 60)
    
    if phone_number:
        # 특정 사용자 확인
        try:
            user = User.objects.get(phone=phone_number)
            print_user_info(user)
            return user
        except User.DoesNotExist:
            print(f"❌ 전화번호 '{phone_number}'인 사용자를 찾을 수 없습니다.")
            
            # 비슷한 전화번호 검색
            similar_users = User.objects.filter(phone__contains=phone_number[:3])
            if similar_users.exists():
                print(f"\n🔍 비슷한 전화번호의 사용자들:")
                for user in similar_users[:5]:
                    print(f"  - {user.phone} | {user.username} | {user.get_role_display()}")
            return None
    else:
        # 모든 사용자 확인
        users = User.objects.all().order_by('-date_joined')[:10]
        print(f"📋 최근 등록된 사용자 {len(users)}명:")
        print("-" * 60)
        for user in users:
            print_user_info(user, brief=True)
        return users

def print_user_info(user, brief=False):
    """사용자 정보 출력"""
    if brief:
        status = "✅" if user.is_staff or user.is_superuser else "❌"
        print(f"{status} {user.phone} | {user.username} | {user.get_role_display()} | staff:{user.is_staff} | super:{user.is_superuser}")
    else:
        print(f"\n👤 사용자 정보:")
        print(f"  - 전화번호: {user.phone}")
        print(f"  - 사용자명: {user.username}")
        print(f"  - 이름: {user.first_name} {user.last_name}")
        print(f"  - 이메일: {user.email}")
        print(f"  - 역할: {user.get_role_display()}")
        print(f"  - 활성화: {user.is_active}")
        print(f"  - 스태프 권한: {user.is_staff}")
        print(f"  - 슈퍼유저 권한: {user.is_superuser}")
        print(f"  - 매장 관리자: {user.is_store_owner}")
        print(f"  - 가입일: {user.date_joined}")
        print(f"  - 마지막 로그인: {user.last_login}")
        
        # 배너 관리 권한 확인
        can_manage_banners = user.is_staff or user.is_superuser
        print(f"\n🎯 배너 관리 권한:")
        print(f"  - 배너 관리 가능: {'✅ 가능' if can_manage_banners else '❌ 불가능'}")
        
        if not can_manage_banners:
            print(f"  - 권한 부여 필요: is_staff=True 또는 is_superuser=True")

def fix_user_permissions(phone_number, make_admin=True):
    """사용자 권한 수정"""
    try:
        user = User.objects.get(phone=phone_number)
        
        print(f"\n🔧 사용자 권한 수정: {user.phone}")
        print(f"현재 권한: staff={user.is_staff}, super={user.is_superuser}")
        
        if make_admin:
            # 관리자 권한 부여
            user.role = 'ADMIN'
            user.is_staff = True
            user.is_superuser = True
            user.is_store_owner = False
            user.is_active = True
            user.save()
            
            print(f"✅ 관리자 권한 부여 완료!")
            print(f"수정된 권한: staff={user.is_staff}, super={user.is_superuser}")
        else:
            # 매장 관리자 권한 부여
            user.role = 'STORE_OWNER'
            user.is_staff = True
            user.is_superuser = False
            user.is_store_owner = True
            user.is_active = True
            user.save()
            
            print(f"✅ 매장 관리자 권한 부여 완료!")
            print(f"수정된 권한: staff={user.is_staff}, super={user.is_superuser}")
        
        return True
        
    except User.DoesNotExist:
        print(f"❌ 전화번호 '{phone_number}'인 사용자를 찾을 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 권한 수정 중 오류: {str(e)}")
        return False

def create_admin_user(phone_number="010-0000-0000", password="1234"):
    """관리자 계정 생성"""
    try:
        user, created = User.objects.get_or_create(
            phone=phone_number,
            defaults={
                'username': phone_number,
                'email': 'admin@kasl.co.kr',
                'password': make_password(password),
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_store_owner': False,
                'is_active': True,
                'first_name': '관리자',
                'nickname': '시스템관리자'
            }
        )
        
        if created:
            print(f"✅ 새 관리자 계정 생성 완료: {phone_number}")
        else:
            print(f"⚠️ 기존 계정 발견. 권한 업데이트 중...")
            user.role = 'ADMIN'
            user.is_staff = True
            user.is_superuser = True
            user.is_store_owner = False
            user.is_active = True
            user.set_password(password)
            user.save()
            print(f"✅ 계정 권한 업데이트 완료: {phone_number}")
        
        print(f"\n🎉 로그인 정보:")
        print(f"  - 전화번호: {phone_number}")
        print(f"  - 비밀번호: {password}")
        print(f"  - 권한: {user.get_role_display()}")
        
        return user
        
    except Exception as e:
        print(f"❌ 관리자 계정 생성 실패: {str(e)}")
        return None

def main():
    args = sys.argv[1:]
    
    if len(args) == 0:
        # 모든 사용자 권한 확인
        check_user_permissions()
    elif len(args) == 1:
        phone_number = args[0]
        if phone_number == "create":
            # 기본 관리자 계정 생성
            create_admin_user()
        else:
            # 특정 사용자 권한 확인
            check_user_permissions(phone_number)
    elif len(args) == 2:
        phone_number = args[0]
        action = args[1]
        
        if action == "fix":
            # 권한 수정
            fix_user_permissions(phone_number, make_admin=True)
        elif action == "store":
            # 매장 관리자 권한 부여
            fix_user_permissions(phone_number, make_admin=False)
        elif action == "create":
            # 특정 전화번호로 관리자 계정 생성
            create_admin_user(phone_number)
        else:
            print("❌ 올바르지 않은 명령어입니다.")
            print_usage()
    else:
        print_usage()

def print_usage():
    print("\n📖 사용법:")
    print("  python check_user_permissions.py                     # 모든 사용자 권한 확인")
    print("  python check_user_permissions.py 010-0000-0000      # 특정 사용자 권한 확인")
    print("  python check_user_permissions.py 010-0000-0000 fix  # 관리자 권한 부여")
    print("  python check_user_permissions.py 010-0000-0000 store # 매장 관리자 권한 부여")
    print("  python check_user_permissions.py create             # 기본 관리자 계정 생성")
    print("  python check_user_permissions.py 010-1234-5678 create # 특정 번호로 관리자 계정 생성")

if __name__ == "__main__":
    main() 