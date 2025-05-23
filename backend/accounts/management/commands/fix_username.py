from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '사용자의 username을 phone과 동일하게 설정'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # 010-5555-5555 사용자 확인
        try:
            user = User.objects.get(phone='010-5555-5555')
            self.stdout.write(f"사용자 발견: {user}")
            self.stdout.write(f"현재 username: '{user.username}'")
            self.stdout.write(f"phone: '{user.phone}'")
            
            # username을 phone과 동일하게 설정
            user.username = user.phone
            user.save()
            
            self.stdout.write(f"username 업데이트 완료: '{user.username}'")
            self.stdout.write(f"비밀번호 체크: {user.check_password('jjw')}")
            self.stdout.write(f"is_store_owner: {user.is_store_owner}")
            self.stdout.write(f"is_active: {user.is_active}")
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('해당 사용자를 찾을 수 없습니다.'))
            
        self.stdout.write(self.style.SUCCESS('작업 완료!')) 