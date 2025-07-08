from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '모든 사용자의 비밀번호를 동일한 값으로 리셋합니다 (개발/테스트용)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='1234',
            help='설정할 비밀번호 (기본값: 1234)'
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='실제로 비밀번호 리셋을 실행'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        password = options['password']
        
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️ 주의: 모든 사용자의 비밀번호를 "{password}"로 변경합니다.\n'
                    '이 작업은 개발/테스트 환경에서만 사용해야 합니다!\n'
                    '실행하려면 --confirm 옵션을 사용하세요.\n'
                    f'명령어: python manage.py reset_all_passwords --password={password} --confirm'
                )
            )
            return
        
        # 모든 사용자 가져오기
        users = User.objects.all()
        total_users = users.count()
        
        if total_users == 0:
            self.stdout.write(self.style.WARNING('사용자가 없습니다.'))
            return
        
        self.stdout.write(f"총 {total_users}명의 사용자 비밀번호를 변경합니다...")
        
        # 비밀번호 변경 작업
        updated_count = 0
        failed_count = 0
        
        for user in users:
            try:
                user.set_password(password)
                user.save()
                updated_count += 1
                
                # 사용자 정보 출력 (역할별로 색상 구분)
                if user.role == 'ADMIN':
                    color = self.style.ERROR  # 빨간색
                elif user.role == 'STORE_OWNER':
                    color = self.style.WARNING  # 노란색
                else:
                    color = self.style.SUCCESS  # 초록색
                
                self.stdout.write(
                    color(f"✅ {user.phone} ({user.nickname or '닉네임없음'}) - {user.get_role_display()}")
                )
                
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f"❌ {user.phone} 실패: {str(e)}")
                )
        
        # 결과 요약
        self.stdout.write("\n" + "="*50)
        self.stdout.write(f"총 사용자: {total_users}명")
        self.stdout.write(self.style.SUCCESS(f"성공: {updated_count}명"))
        if failed_count > 0:
            self.stdout.write(self.style.ERROR(f"실패: {failed_count}명"))
        
        self.stdout.write(f"\n🔑 모든 사용자의 비밀번호가 '{password}'로 설정되었습니다.")
        
        # 역할별 사용자 수 통계
        self.stdout.write("\n📊 역할별 사용자 수:")
        role_stats = {}
        for choice in User.ROLE_CHOICES:
            role_code, role_name = choice
            count = User.objects.filter(role=role_code).count()
            role_stats[role_name] = count
            if count > 0:
                self.stdout.write(f"  - {role_name}: {count}명")
        
        # 로그인 테스트 안내
        self.stdout.write("\n🚀 테스트 로그인 정보:")
        self.stdout.write("="*30)
        
        # 각 역할별 대표 사용자 출력
        for role_code, role_name in User.ROLE_CHOICES:
            user = User.objects.filter(role=role_code).first()
            if user:
                self.stdout.write(f"{role_name} 계정:")
                self.stdout.write(f"  전화번호: {user.phone}")
                self.stdout.write(f"  비밀번호: {password}")
                self.stdout.write(f"  닉네임: {user.nickname or '없음'}")
                self.stdout.write("")
        
        self.stdout.write(
            self.style.SUCCESS('✨ 비밀번호 리셋 완료!')
        ) 