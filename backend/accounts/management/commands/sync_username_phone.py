from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '모든 사용자의 username을 phone과 동일하게 설정'

    def handle(self, *args, **options):
        User = get_user_model()
        
        users = User.objects.all()
        updated_count = 0
        
        for user in users:
            if user.username != user.phone:
                old_username = user.username
                user.username = user.phone
                user.save()
                updated_count += 1
                self.stdout.write(f"사용자 {old_username} → {user.phone} 업데이트 완료")
            else:
                self.stdout.write(f"사용자 {user.phone} 이미 동기화됨")
        
        self.stdout.write(
            self.style.SUCCESS(f'작업 완료! {updated_count}명의 사용자 업데이트됨')
        ) 