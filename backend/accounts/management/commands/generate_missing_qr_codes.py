from django.core.management.base import BaseCommand
from accounts.models import User
from django.db import transaction


class Command(BaseCommand):
    help = '기존 사용자들의 누락된 QR 코드를 일괄 생성합니다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='기존 QR 코드가 있어도 새로 생성합니다.',
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='특정 사용자 ID만 처리합니다.',
        )

    def handle(self, *args, **options):
        force = options['force']
        user_id = options.get('user_id')
        
        self.stdout.write(self.style.SUCCESS('QR 코드 생성 작업을 시작합니다...'))
        
        # 사용자 쿼리 설정
        if user_id:
            users = User.objects.filter(id=user_id)
            if not users.exists():
                self.stdout.write(self.style.ERROR(f'사용자 ID {user_id}를 찾을 수 없습니다.'))
                return
        else:
            if force:
                users = User.objects.all()
            else:
                users = User.objects.filter(qr_code='')
        
        total_users = users.count()
        self.stdout.write(f'처리할 사용자 수: {total_users}')
        
        success_count = 0
        error_count = 0
        
        for user in users:
            try:
                with transaction.atomic():
                    # 기존 QR 코드가 있고 force가 아닌 경우 스킵
                    if user.qr_code and not force:
                        continue
                    
                    # 기존 QR 코드 제거 (force인 경우)
                    if force and user.qr_code:
                        user.qr_code.delete(save=False)
                        user.qr_code = None
                    
                    # QR 코드 생성
                    qr_code = user.generate_qr_code()
                    
                    if qr_code:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ 사용자 {user.phone} (ID: {user.id}) QR 코드 생성 완료'
                            )
                        )
                        success_count += 1
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f'✗ 사용자 {user.phone} (ID: {user.id}) QR 코드 생성 실패'
                            )
                        )
                        error_count += 1
                        
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ 사용자 {user.phone} (ID: {user.id}) 처리 중 오류: {str(e)}'
                    )
                )
                error_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\n작업 완료!'))
        self.stdout.write(f'성공: {success_count}개')
        self.stdout.write(f'실패: {error_count}개')
        
        if error_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    '\n실패한 사용자들이 있습니다. 로그를 확인하여 문제를 해결해주세요.'
                )
            ) 