#!/usr/bin/env python
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from django.contrib.auth import get_user_model
from stores.models import Store

User = get_user_model()

def create_test_data():
    print("=== 테스트 데이터 생성 시작 ===")
    
    # 기존 데이터 확인
    print("\n=== 기존 사용자 확인 ===")
    for user in User.objects.all():
        print(f"ID: {user.id}, Phone: {user.phone}, Nickname: {user.nickname}, is_store_owner: {user.is_store_owner}")
    
    print("\n=== 기존 매장 확인 ===")
    for store in Store.objects.all():
        print(f"ID: {store.id}, Name: {store.name}, Owner: {store.owner.phone}")
    
    # 매장 관리자 생성 또는 업데이트
    store_manager_phone = "010-1234-5678"
    store_manager, created = User.objects.get_or_create(
        phone=store_manager_phone,
        defaults={
            'username': 'store_manager',
            'nickname': '매장관리자',
            'is_store_owner': True,
            'role': 'STORE_OWNER',
            'email': 'manager@aslholdem.com'
        }
    )
    
    if not created:
        # 기존 사용자를 매장 관리자로 업데이트
        store_manager.is_store_owner = True
        store_manager.role = 'STORE_OWNER'
        store_manager.nickname = '매장관리자'
        store_manager.save()
        print(f"기존 사용자 업데이트: {store_manager.phone}")
    else:
        print(f"새 매장 관리자 생성: {store_manager.phone}")
    
    # 비밀번호 설정
    store_manager.set_password('password123')
    store_manager.save()
    
    # 매장 생성 또는 업데이트
    store, created = Store.objects.get_or_create(
        owner=store_manager,
        defaults={
            'name': 'ASL Poker Store 2222',
            'address': '서울시 강남구 2번지',
            'description': '프리미엄 홀덤 매장 2',
            'status': 'ACTIVE',
            'phone_number': '02-123-4567',
            'open_time': '10:00',
            'close_time': '22:00',
            'manager_name': '김매니저',
            'manager_phone': '010-1234-5678',
            'max_capacity': 50
        }
    )
    
    if created:
        print(f"새 매장 생성: {store.name}")
    else:
        print(f"기존 매장 확인: {store.name}")
    
    print("\n=== 생성된 데이터 확인 ===")
    print(f"매장 관리자: {store_manager.phone} ({store_manager.nickname})")
    print(f"매장: {store.name} (ID: {store.id})")
    print(f"매장 소유자: {store.owner.phone}")
    
    print("\n=== 테스트 데이터 생성 완료 ===")

if __name__ == '__main__':
    create_test_data() 