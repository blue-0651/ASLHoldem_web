from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models

class Command(BaseCommand):
    help = '모든 사용자의 username 값을 nickname으로 동기화'

    def handle(self, *args, **options):
        User = get_user_model()
        
        # username이 있지만 nickname이 없는 사용자들 처리
        users_to_sync = User.objects.filter(
            models.Q(nickname__isnull=True) | models.Q(nickname='')
        ).exclude(
            models.Q(username__isnull=True) | models.Q(username='')
        )
        
        updated_count = 0
        
        self.stdout.write(f"동기화할 사용자 수: {users_to_sync.count()}명")
        
        for user in users_to_sync:
            # username이 phone과 다르다면 nickname으로 설정
            if user.username != user.phone:
                old_nickname = user.nickname
                user.nickname = user.username
                user.save()
                
                updated_count += 1
                self.stdout.write(f"사용자 ID {user.id} ({user.phone}): nickname '{old_nickname}' → '{user.nickname}'")
            else:
                self.stdout.write(f"사용자 ID {user.id} ({user.phone}): username이 phone과 동일하여 건너뜀")
        
        # 결과 출력
        self.stdout.write(
            self.style.SUCCESS(f'동기화 완료! {updated_count}명의 사용자 nickname 업데이트됨')
        )
        
        # 현재 상태 확인
        total_users = User.objects.count()
        users_with_nickname = User.objects.exclude(
            models.Q(nickname__isnull=True) | models.Q(nickname='')
        ).count()
        
        self.stdout.write(f"전체 사용자: {total_users}명")
        self.stdout.write(f"닉네임 보유: {users_with_nickname}명")
        self.stdout.write(f"닉네임 비율: {(users_with_nickname/total_users*100):.1f}%") 