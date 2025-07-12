from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = '빈 문자열 username을 가진 사용자들을 정리합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 변경 없이 문제만 확인',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='확인 없이 자동으로 실행',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']
        
        self.stdout.write(self.style.SUCCESS('=== 빈 문자열 username 정리 시작 ==='))
        
        # 빈 문자열 username을 가진 사용자들 조회
        empty_username_users = User.objects.filter(username='')
        
        if not empty_username_users.exists():
            self.stdout.write(self.style.SUCCESS('✅ 빈 문자열 username을 가진 사용자가 없습니다.'))
            return
        
        self.stdout.write(f'📋 빈 문자열 username을 가진 사용자 {empty_username_users.count()}명 발견')
        
        # 각 사용자 정보 출력
        for user in empty_username_users:
            self.stdout.write(f'  - ID: {user.id}, 전화번호: {user.phone}, 닉네임: {user.nickname}, 역할: {user.role}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN 모드: 실제 변경사항은 적용되지 않습니다.'))
            return
        
        # 사용자 확인 (force 옵션이 없는 경우)
        if not force:
            confirm = input('\n위 사용자들의 username을 phone 번호로 변경하시겠습니까? (y/N): ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('❌ 작업이 취소되었습니다.'))
                return
        
        # 트랜잭션으로 처리
        success_count = 0
        error_count = 0
        
        with transaction.atomic():
            for user in empty_username_users:
                try:
                    # phone 번호를 username으로 설정
                    old_username = user.username
                    user.username = user.phone
                    user.save()
                    
                    self.stdout.write(f'✅ 사용자 ID {user.id}: username "" → "{user.phone}"')
                    success_count += 1
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'❌ 사용자 ID {user.id} 처리 실패: {str(e)}')
                    )
                    error_count += 1
        
        # 결과 출력
        self.stdout.write(f'\n=== 작업 완료 ===')
        self.stdout.write(f'✅ 성공: {success_count}명')
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'❌ 실패: {error_count}명'))
        
        # 검증
        remaining_empty = User.objects.filter(username='').count()
        if remaining_empty == 0:
            self.stdout.write(self.style.SUCCESS('🎉 모든 빈 문자열 username이 정리되었습니다!'))
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️  아직 {remaining_empty}명의 빈 문자열 username이 남아있습니다.')
            ) 