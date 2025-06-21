from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '매장관리자 계정(010-5555-5555) 생성/확인 및 매장 생성'

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
                username=phone,  # username 필드도 설정
                is_store_owner=True,
                nickname='매장관리자',
                email='store@example.com'
            )
            user.set_password(password)
            user.save()
            
            self.stdout.write(f"새 매장관리자 계정 생성: {user}")
            self.stdout.write(f"is_store_owner: {user.is_store_owner}")
            self.stdout.write(f"비밀번호 체크: {user.check_password(password)}")
        
        # 매장 생성 또는 확인
        from stores.models import Store
        
        try:
            store = Store.objects.get(owner=user)
            self.stdout.write(f"기존 매장 발견: {store.name} (ID: {store.id})")
        except Store.DoesNotExist:
            # 새 매장 생성
            store = Store.objects.create(
                name='테스트 매장',
                owner=user,
                address='서울특별시 강남구 테스트로 123',
                description='테스트용 매장입니다.',
                status='ACTIVE',
                phone_number='02-123-4567',
                manager_name='매장관리자',
                manager_phone=phone,
                max_capacity=50
            )
            self.stdout.write(f"새 매장 생성: {store.name} (ID: {store.id})")
        except Store.MultipleObjectsReturned:
            stores = Store.objects.filter(owner=user)
            self.stdout.write(f"여러 매장 발견: {stores.count()}개")
            for store in stores:
                self.stdout.write(f"  - {store.name} (ID: {store.id})")
        
        self.stdout.write(self.style.SUCCESS('매장관리자 계정 및 매장 준비 완료!')) 