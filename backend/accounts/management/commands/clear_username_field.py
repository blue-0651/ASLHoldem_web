from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models

class Command(BaseCommand):
    help = 'username 필드를 빈 값으로 설정 (삭제 대신 안전한 방법)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='실제로 username을 빈 값으로 설정'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️ 주의: username 필드를 빈 값으로 설정하는 것은 신중해야 합니다.\n'
                    '실행하려면 --confirm 옵션을 사용하세요.'
                )
            )
            return
        
        # username이 비어있지 않은 사용자들 확인
        users_with_username = User.objects.exclude(
            models.Q(username__isnull=True) | models.Q(username='')
        )
        
        self.stdout.write(f"username이 설정된 사용자 수: {users_with_username.count()}명")
        
        if users_with_username.count() == 0:
            self.stdout.write(self.style.SUCCESS('모든 사용자의 username이 이미 비어있습니다.'))
            return
        
        # 백업 생성
        backup_data = []
        for user in users_with_username:
            backup_data.append({
                'id': user.id,
                'phone': user.phone,
                'old_username': user.username,
                'nickname': user.nickname
            })
        
        # username을 빈 값으로 설정
        updated_count = 0
        for user in users_with_username:
            old_username = user.username
            user.username = f"user_{user.id}"  # unique 제약조건 때문에 고유값 필요
            user.save()
            
            updated_count += 1
            self.stdout.write(f"사용자 ID {user.id} ({user.phone}): username '{old_username}' → '{user.username}'")
        
        # 백업 정보 출력
        self.stdout.write("\n=== 백업 정보 ===")
        for backup in backup_data:
            self.stdout.write(f"ID {backup['id']}: {backup['old_username']} → {backup['nickname']}")
        
        self.stdout.write(
            self.style.SUCCESS(f'\n완료! {updated_count}명의 사용자 username 정리됨')
        )
        
        self.stdout.write(
            self.style.WARNING(
                '\n📝 참고: username 필드는 Django AbstractUser의 필수 필드이므로 '
                '완전히 제거할 수 없습니다. 대신 의미 없는 값으로 설정했습니다.'
            )
        ) 