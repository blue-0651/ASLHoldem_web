import os
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("=== 매장관리자 계정 확인 ===")

# 모든 사용자 조회
users = User.objects.all()
print(f"총 {users.count()}명의 사용자가 등록되어 있습니다.\n")

for user in users:
    print(f"ID: {user.id}")
    print(f"전화번호: {user.phone}")
    print(f"닉네임: {user.nickname if user.nickname else '없음'}")
    print(f"이메일: {user.email}")
    print(f"매장관리자: {user.is_store_owner}")
    print(f"활성 상태: {user.is_active}")
    print(f"권한: {user.role if hasattr(user, 'role') else '없음'}")
    print(f"스태프: {user.is_staff}")
    print(f"슈퍼유저: {user.is_superuser}")
    
    # 비밀번호 테스트
    test_passwords = ['jjw', 'pks', 'testpass123']
    for pwd in test_passwords:
        if user.check_password(pwd):
            print(f"비밀번호: {pwd} ✓")
            break
    else:
        print("비밀번호: 확인 불가")
    
    print("-" * 50)

# 매장관리자만 필터링
store_managers = User.objects.filter(is_store_owner=True)
print(f"\n매장관리자 계정: {store_managers.count()}명")
for manager in store_managers:
    print(f"  - {manager.phone} ({manager.nickname})")

# 010-5555-5555 계정 확인
print("\n=== 010-5555-5555 계정 상세 확인 ===")
try:
    target_user = User.objects.get(phone='010-5555-5555')
    print(f"계정 존재: ✓")
    print(f"매장관리자 여부: {target_user.is_store_owner}")
    print(f"활성 상태: {target_user.is_active}")
    print(f"권한: {target_user.role}")
    
    # 비밀번호 확인
    if target_user.check_password('jjw'):
        print("비밀번호 'jjw': ✓")
    else:
        print("비밀번호 'jjw': ✗")
        
    # 매장관리자로 설정
    if not target_user.is_store_owner:
        target_user.is_store_owner = True
        target_user.role = 'STORE_OWNER'
        target_user.save()
        print("매장관리자 권한을 설정했습니다.")
        
except User.DoesNotExist:
    print("010-5555-5555 계정이 존재하지 않습니다.")
    print("매장관리자 계정을 생성합니다...")
    
    manager = User.objects.create_user(
        username='010-5555-5555',
        phone='010-5555-5555',
        password='jjw',
        nickname='매장관리자',
        email='store@example.com',
        is_store_owner=True,
        is_active=True
    )
    manager.role = 'STORE_OWNER'
    manager.save()
    print("매장관리자 계정이 생성되었습니다.") 