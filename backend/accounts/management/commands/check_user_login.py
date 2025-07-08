from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from accounts.models import User
from django.contrib.auth.hashers import check_password

class Command(BaseCommand):
    help = '특정 사용자의 로그인 상태 및 권한을 확인합니다'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='확인할 사용자명 (전화번호)')
        parser.add_argument('--password', type=str, help='테스트할 비밀번호')

    def handle(self, *args, **options):
        username = options['username']
        password = options.get('password')
        
        try:
            user = User.objects.get(username=username)
            
            self.stdout.write(f"\n=== 사용자 정보: {username} ===")
            self.stdout.write(f"ID: {user.id}")
            self.stdout.write(f"사용자명: {user.username}")
            self.stdout.write(f"이름: {user.first_name}")
            self.stdout.write(f"전화번호: {user.phone}")
            self.stdout.write(f"이메일: {user.email}")
            self.stdout.write(f"활성화: {user.is_active}")
            self.stdout.write(f"스태프: {user.is_staff}")
            self.stdout.write(f"슈퍼유저: {user.is_superuser}")
            self.stdout.write(f"역할: {user.role}")
            self.stdout.write(f"가입일: {user.date_joined}")
            self.stdout.write(f"마지막 로그인: {user.last_login}")
            
            # 비밀번호 테스트
            if password:
                self.stdout.write(f"\n=== 비밀번호 테스트 ===")
                
                # 1. check_password로 직접 확인
                is_password_correct = check_password(password, user.password)
                self.stdout.write(f"비밀번호 일치: {is_password_correct}")
                
                # 2. authenticate로 확인
                auth_user = authenticate(username=username, password=password)
                self.stdout.write(f"Django 인증 성공: {auth_user is not None}")
                
                if not is_password_correct:
                    self.stdout.write(self.style.WARNING(f"입력한 비밀번호 '{password}'가 저장된 비밀번호와 일치하지 않습니다."))
                
                if not auth_user:
                    self.stdout.write(self.style.WARNING("Django 인증에 실패했습니다."))
                    if not user.is_active:
                        self.stdout.write(self.style.ERROR("사용자가 비활성화 상태입니다."))
            
            # 권한 확인
            self.stdout.write(f"\n=== 권한 정보 ===")
            if user.role == 'ADMIN':
                expected_staff = True
                expected_superuser = True
            elif user.role == 'STORE_MANAGER':
                expected_staff = True
                expected_superuser = False
            else:
                expected_staff = False
                expected_superuser = False
                
            self.stdout.write(f"예상 스태프 권한: {expected_staff}, 실제: {user.is_staff}")
            self.stdout.write(f"예상 슈퍼유저 권한: {expected_superuser}, 실제: {user.is_superuser}")
            
            if user.is_staff != expected_staff or user.is_superuser != expected_superuser:
                self.stdout.write(self.style.WARNING("권한이 역할과 일치하지 않습니다. 권한 동기화가 필요합니다."))
            
            # 관리자 로그인 가능 여부
            self.stdout.write(f"\n=== 관리자 로그인 가능 여부 ===")
            can_admin_login = user.is_active and user.is_staff
            self.stdout.write(f"관리자 화면 접근 가능: {can_admin_login}")
            
            if not can_admin_login:
                reasons = []
                if not user.is_active:
                    reasons.append("사용자가 비활성화됨")
                if not user.is_staff:
                    reasons.append("스태프 권한 없음")
                self.stdout.write(self.style.ERROR(f"관리자 로그인 불가 이유: {', '.join(reasons)}"))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"사용자 '{username}'를 찾을 수 없습니다."))
            
            # 비슷한 사용자명 검색
            similar_users = User.objects.filter(username__icontains=username[:5])
            if similar_users:
                self.stdout.write("\n비슷한 사용자명들:")
                for similar_user in similar_users:
                    self.stdout.write(f"  - {similar_user.username} ({similar_user.first_name})") 