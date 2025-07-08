from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '사용자들의 비밀번호가 올바르게 설정되었는지 확인합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='1234',
            help='확인할 비밀번호 (기본값: 1234)'
        )
        parser.add_argument(
            '--phone',
            type=str,
            help='특정 전화번호의 사용자만 확인'
        )
        parser.add_argument(
            '--role',
            type=str,
            choices=['ADMIN', 'STORE_OWNER', 'USER', 'GUEST'],
            help='특정 역할의 사용자만 확인'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        password = options['password']
        phone = options.get('phone')
        role = options.get('role')
        
        # 쿼리셋 필터링
        users = User.objects.all()
        
        if phone:
            users = users.filter(phone=phone)
            if not users.exists():
                self.stdout.write(self.style.ERROR(f"전화번호 {phone}인 사용자를 찾을 수 없습니다."))
                return
        
        if role:
            users = users.filter(role=role)
            if not users.exists():
                self.stdout.write(self.style.ERROR(f"역할이 {role}인 사용자를 찾을 수 없습니다."))
                return
        
        total_users = users.count()
        correct_password_count = 0
        wrong_password_count = 0
        
        self.stdout.write(f"📋 총 {total_users}명의 사용자 비밀번호를 확인합니다...")
        self.stdout.write(f"🔑 확인할 비밀번호: '{password}'")
        self.stdout.write("=" * 50)
        
        for user in users:
            try:
                is_correct = user.check_password(password)
                
                if is_correct:
                    correct_password_count += 1
                    # 역할별 색상 구분
                    if user.role == 'ADMIN':
                        color = self.style.ERROR  # 빨간색
                    elif user.role == 'STORE_OWNER':
                        color = self.style.WARNING  # 노란색
                    else:
                        color = self.style.SUCCESS  # 초록색
                    
                    self.stdout.write(
                        color(f"✅ {user.phone} ({user.nickname or '닉네임없음'}) - {user.get_role_display()} - 비밀번호 일치")
                    )
                else:
                    wrong_password_count += 1
                    self.stdout.write(
                        self.style.ERROR(f"❌ {user.phone} ({user.nickname or '닉네임없음'}) - {user.get_role_display()} - 비밀번호 불일치")
                    )
                    
            except Exception as e:
                wrong_password_count += 1
                self.stdout.write(
                    self.style.ERROR(f"💥 {user.phone} 확인 실패: {str(e)}")
                )
        
        # 결과 요약
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("📊 비밀번호 확인 결과:")
        self.stdout.write(f"총 사용자: {total_users}명")
        self.stdout.write(self.style.SUCCESS(f"✅ 올바른 비밀번호: {correct_password_count}명"))
        if wrong_password_count > 0:
            self.stdout.write(self.style.ERROR(f"❌ 잘못된 비밀번호: {wrong_password_count}명"))
        
        success_rate = (correct_password_count / total_users * 100) if total_users > 0 else 0
        self.stdout.write(f"성공률: {success_rate:.1f}%")
        
        if wrong_password_count == 0:
            self.stdout.write(self.style.SUCCESS("🎉 모든 사용자의 비밀번호가 올바르게 설정되었습니다!"))
        else:
            self.stdout.write(self.style.WARNING("⚠️ 일부 사용자의 비밀번호가 다릅니다."))
            self.stdout.write("비밀번호를 다시 리셋하려면:")
            self.stdout.write(f"python manage.py reset_all_passwords --password={password} --confirm")
            
        # 역할별 로그인 테스트 안내
        if not phone and not role:
            self.stdout.write("\n🚀 로그인 테스트 가능한 계정들:")
            self.stdout.write("=" * 30)
            
            for role_code, role_name in User.ROLE_CHOICES:
                user = users.filter(role=role_code).first()
                if user and user.check_password(password):
                    self.stdout.write(f"{role_name} 로그인:")
                    self.stdout.write(f"  전화번호: {user.phone}")
                    self.stdout.write(f"  비밀번호: {password}")
                    self.stdout.write(f"  닉네임: {user.nickname or '없음'}")
                    self.stdout.write("") 