import os
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("=== 등록된 사용자 목록 ===")
users = User.objects.all()

if users.count() == 0:
    print("등록된 사용자가 없습니다.")
else:
    for user in users:
        print(f"ID: {user.id}")
        print(f"전화번호: {user.phone}")
        print(f"닉네임: {user.nickname if user.nickname else '없음'}")
        print(f"매장관리자: {user.is_store_owner}")
        print(f"활성 상태: {user.is_active}")
        print(f"권한: {user.role if hasattr(user, 'role') else '없음'}")
        print("-" * 30)

print(f"총 {users.count()}명의 사용자가 등록되어 있습니다.")

# 테스트용 사용자 생성
print("\n=== 테스트용 사용자 생성 ===")
test_phone = "01012345678"
test_password = "pks"

# 이미 존재하는지 확인
if User.objects.filter(phone=test_phone).exists():
    print(f"전화번호 {test_phone}는 이미 등록되어 있습니다.")
else:
    try:
        # 테스트용 일반 사용자 생성
        test_user = User.objects.create_user(
            phone=test_phone,
            password=test_password,
            nickname="테스트유저",
            is_store_owner=False,
            is_active=True
        )
        print(f"테스트용 사용자가 생성되었습니다: {test_phone}")
        print(f"비밀번호: {test_password}")
    except Exception as e:
        print(f"사용자 생성 중 오류 발생: {e}") 