from django.core.management.base import BaseCommand
from accounts.models import User
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = '특정 사용자의 로그인 문제를 해결합니다'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='수정할 사용자명 (전화번호)')
        parser.add_argument('--password', type=str, help='새로 설정할 비밀번호')
        parser.add_argument('--activate', action='store_true', help='사용자 활성화')
        parser.add_argument('--role', type=str, choices=['ADMIN', 'STORE_MANAGER', 'USER'], help='역할 설정')
        parser.add_argument('--sync-permissions', action='store_true', help='역할에 맞는 권한 동기화')

    def handle(self, *args, **options):
        username = options['username']
        password = options.get('password')
        activate = options.get('activate')
        role = options.get('role')
        sync_permissions = options.get('sync_permissions')
        
        try:
            user = User.objects.get(username=username)
            
            self.stdout.write(f"\n=== 수정 전 사용자 정보: {username} ===")
            self.stdout.write(f"활성화: {user.is_active}")
            self.stdout.write(f"스태프: {user.is_staff}")
            self.stdout.write(f"슈퍼유저: {user.is_superuser}")
            self.stdout.write(f"역할: {user.role}")
            
            # 비밀번호 변경
            if password:
                user.password = make_password(password)
                self.stdout.write(f"비밀번호를 '{password}'로 변경합니다.")
            
            # 사용자 활성화
            if activate:
                user.is_active = True
                self.stdout.write("사용자를 활성화합니다.")
            
            # 역할 변경
            if role:
                user.role = role
                self.stdout.write(f"역할을 '{role}'로 변경합니다.")
            
            # 권한 동기화
            if sync_permissions or role:
                if user.role == 'ADMIN':
                    user.is_staff = True
                    user.is_superuser = True
                    self.stdout.write("ADMIN 역할에 맞게 스태프, 슈퍼유저 권한을 부여합니다.")
                elif user.role == 'STORE_MANAGER':
                    user.is_staff = True
                    user.is_superuser = False
                    self.stdout.write("STORE_MANAGER 역할에 맞게 스태프 권한을 부여합니다.")
                else:  # USER
                    user.is_staff = False
                    user.is_superuser = False
                    self.stdout.write("USER 역할에 맞게 일반 사용자 권한으로 설정합니다.")
            
            # 변경사항 저장
            user.save()
            
            self.stdout.write(f"\n=== 수정 후 사용자 정보: {username} ===")
            self.stdout.write(f"활성화: {user.is_active}")
            self.stdout.write(f"스태프: {user.is_staff}")
            self.stdout.write(f"슈퍼유저: {user.is_superuser}")
            self.stdout.write(f"역할: {user.role}")
            
            # 관리자 로그인 가능 여부 확인
            can_admin_login = user.is_active and user.is_staff
            self.stdout.write(f"\n관리자 화면 접근 가능: {can_admin_login}")
            
            if can_admin_login:
                self.stdout.write(self.style.SUCCESS(f"사용자 '{username}' 관리자 로그인 문제가 해결되었습니다!"))
            else:
                self.stdout.write(self.style.WARNING("아직 관리자 로그인이 불가능합니다. 추가 확인이 필요합니다."))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"사용자 '{username}'를 찾을 수 없습니다."))
            
            # 새 사용자 생성 여부 확인
            create_new = input(f"새로운 사용자 '{username}'를 생성하시겠습니까? (y/N): ")
            if create_new.lower() == 'y':
                new_password = password or 'admin123'
                new_role = role or 'ADMIN'
                
                user = User.objects.create_user(
                    username=username,
                    phone=username,
                    password=new_password,
                    role=new_role,
                    is_active=True,
                    is_staff=True if new_role in ['ADMIN', 'STORE_MANAGER'] else False,
                    is_superuser=True if new_role == 'ADMIN' else False
                )
                
                self.stdout.write(self.style.SUCCESS(f"새 사용자 '{username}' 생성 완료!"))
                self.stdout.write(f"비밀번호: {new_password}")
                self.stdout.write(f"역할: {new_role}")
                self.stdout.write(f"관리자 접근 가능: {user.is_staff}")
            else:
                self.stdout.write("사용자 생성을 취소했습니다.") 