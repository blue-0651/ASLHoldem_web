from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '매장관리자 계정(010-5555-5555) 생성/확인'

    def handle(self, *args, **options):
        User = get_user_model()
        phone = '010-5555-5555'
        password = 'jjw'
        
        # 기존 계정 확인
        try:
            user = User.objects.get(phone=phone)
            self.stdout.write(f"기존 계정 발견: {user}")
            self.stdout.write(f"is_store_owner: {user.is_store_owner}")
            self.stdout.write(f"비밀번호 체크: {user.check_password(password)}")
            
            # 권한 및 비밀번호 수정
            user.is_store_owner = True
            user.set_password(password)
            user.save()
            
            self.stdout.write(f"계정 업데이트 완료!")
            self.stdout.write(f"업데이트 후 - is_store_owner: {user.is_store_owner}")
            self.stdout.write(f"업데이트 후 - 비밀번호 체크: {user.check_password(password)}")
            
        except User.DoesNotExist:
            # 새 계정 생성
            user = User.objects.create(
                phone=phone,
                is_store_owner=True,
                nickname='매장관리자',
                email='store@example.com'
            )
            user.set_password(password)
            user.save()
            
            self.stdout.write(f"새 매장관리자 계정 생성: {user}")
            self.stdout.write(f"is_store_owner: {user.is_store_owner}")
            self.stdout.write(f"비밀번호 체크: {user.check_password(password)}")
            
        self.stdout.write(self.style.SUCCESS('매장관리자 계정 준비 완료!')) 