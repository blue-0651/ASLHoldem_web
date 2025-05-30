import os
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# 테스트용 사용자 생성
test_users = [
    {
        'phone': '010-1234-5678',
        'password': 'pks',
        'nickname': '테스트유저1',
        'is_store_owner': False,
        'email': 'test1@example.com'
    },
    {
        'phone': '010-0000-0001',
        'password': 'testpass123',
        'nickname': '테스트유저2',
        'is_store_owner': False,
        'email': 'test2@example.com'
    },
    {
        'phone': '010-5555-5555',
        'password': 'jjw',
        'nickname': '매장관리자',
        'is_store_owner': True,
        'email': 'store@example.com'
    }
]

print("=== 테스트용 사용자 생성 ===")

for user_data in test_users:
    phone = user_data['phone']
    
    # 이미 존재하는지 확인
    if User.objects.filter(phone=phone).exists():
        print(f"전화번호 {phone}는 이미 등록되어 있습니다.")
        existing_user = User.objects.get(phone=phone)
        # 비밀번호 업데이트
        existing_user.set_password(user_data['password'])
        existing_user.save()
        print(f"  → 비밀번호를 {user_data['password']}로 업데이트했습니다.")
    else:
        try:
            # 테스트용 사용자 생성
            test_user = User.objects.create_user(
                username=phone,  # username을 phone과 동일하게 설정
                phone=phone,
                password=user_data['password'],
                nickname=user_data['nickname'],
                is_store_owner=user_data['is_store_owner'],
                email=user_data['email'],
                is_active=True
            )
            print(f"테스트용 사용자가 생성되었습니다: {phone}")
            print(f"  → 비밀번호: {user_data['password']}")
            print(f"  → 닉네임: {user_data['nickname']}")
            print(f"  → 매장관리자: {user_data['is_store_owner']}")
        except Exception as e:
            print(f"사용자 생성 중 오류 발생 ({phone}): {e}")

print("\n=== 생성된 사용자 목록 ===")
users = User.objects.all()
for user in users:
    print(f"ID: {user.id}, 전화번호: {user.phone}, 닉네임: {user.nickname}, 매장관리자: {user.is_store_owner}")

print(f"\n총 {users.count()}명의 사용자가 등록되어 있습니다.") 