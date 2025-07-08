from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = '모든 사용자의 역할에 맞는 권한을 동기화합니다'

    def add_arguments(self, parser):
        parser.add_argument(
            '--phone',
            type=str,
            help='특정 전화번호의 사용자만 동기화'
        )
        parser.add_argument(
            '--role',
            type=str,
            choices=['ADMIN', 'STORE_OWNER', 'USER', 'GUEST'],
            help='특정 역할의 사용자만 동기화'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 변경 없이 미리보기만 실행'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        phone = options.get('phone')
        role = options.get('role')
        dry_run = options['dry_run']
        
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
        updated_count = 0
        
        if dry_run:
            self.stdout.write(self.style.WARNING("🔍 미리보기 모드 - 실제 변경되지 않습니다"))
        
        self.stdout.write(f"📋 총 {total_users}명의 사용자 권한을 동기화합니다...")
        self.stdout.write("=" * 70)
        
        for user in users:
            # 현재 권한 상태
            old_is_staff = user.is_staff
            old_is_superuser = user.is_superuser
            old_is_store_owner = user.is_store_owner
            
            # 역할에 따른 새로운 권한 계산
            if user.role == 'ADMIN':
                new_is_staff = True
                new_is_superuser = True
                new_is_store_owner = False
            elif user.role == 'STORE_OWNER':
                new_is_staff = True
                new_is_superuser = False
                new_is_store_owner = True
            else:  # USER, GUEST
                new_is_staff = False
                new_is_superuser = False
                new_is_store_owner = False
            
            # 변경이 필요한지 확인
            needs_update = (
                old_is_staff != new_is_staff or
                old_is_superuser != new_is_superuser or
                old_is_store_owner != new_is_store_owner
            )
            
            if needs_update:
                updated_count += 1
                
                # 역할별 색상 구분
                if user.role == 'ADMIN':
                    color = self.style.ERROR  # 빨간색
                elif user.role == 'STORE_OWNER':
                    color = self.style.WARNING  # 노란색
                else:
                    color = self.style.SUCCESS  # 초록색
                
                # 변경 사항 출력
                changes = []
                if old_is_staff != new_is_staff:
                    changes.append(f"is_staff: {old_is_staff} → {new_is_staff}")
                if old_is_superuser != new_is_superuser:
                    changes.append(f"is_superuser: {old_is_superuser} → {new_is_superuser}")
                if old_is_store_owner != new_is_store_owner:
                    changes.append(f"is_store_owner: {old_is_store_owner} → {new_is_store_owner}")
                
                self.stdout.write(
                    color(f"🔄 {user.phone} ({user.nickname or '닉네임없음'}) - {user.get_role_display()}")
                )
                for change in changes:
                    self.stdout.write(f"   {change}")
                
                # 실제 업데이트 (dry-run이 아닌 경우)
                if not dry_run:
                    user.is_staff = new_is_staff
                    user.is_superuser = new_is_superuser
                    user.is_store_owner = new_is_store_owner
                    user.save(update_fields=['is_staff', 'is_superuser', 'is_store_owner'])
            else:
                # 권한이 이미 올바른 경우
                if user.role == 'ADMIN':
                    color = self.style.ERROR
                elif user.role == 'STORE_OWNER':
                    color = self.style.WARNING
                else:
                    color = self.style.SUCCESS
                
                self.stdout.write(
                    color(f"✅ {user.phone} ({user.nickname or '닉네임없음'}) - {user.get_role_display()} (권한 정상)")
                )
        
        # 결과 요약
        self.stdout.write("\n" + "=" * 70)
        if dry_run:
            self.stdout.write("🔍 미리보기 결과:")
        else:
            self.stdout.write("📊 권한 동기화 결과:")
        
        self.stdout.write(f"총 사용자: {total_users}명")
        self.stdout.write(f"업데이트 필요: {updated_count}명")
        self.stdout.write(f"이미 정상: {total_users - updated_count}명")
        
        if updated_count > 0:
            if dry_run:
                self.stdout.write(self.style.WARNING(f"⚠️ {updated_count}명의 사용자 권한을 업데이트해야 합니다."))
                self.stdout.write("실제 업데이트하려면:")
                if phone:
                    self.stdout.write(f"python manage.py sync_user_permissions --phone={phone}")
                elif role:
                    self.stdout.write(f"python manage.py sync_user_permissions --role={role}")
                else:
                    self.stdout.write("python manage.py sync_user_permissions")
            else:
                self.stdout.write(self.style.SUCCESS(f"✅ {updated_count}명의 사용자 권한이 업데이트되었습니다!"))
        else:
            self.stdout.write(self.style.SUCCESS("🎉 모든 사용자의 권한이 이미 올바르게 설정되어 있습니다!"))
        
        # 역할별 권한 매핑 안내
        if not phone and not role:
            self.stdout.write("\n📖 역할별 권한 매핑:")
            self.stdout.write("=" * 30)
            self.stdout.write("👑 ADMIN (관리자):")
            self.stdout.write("   - is_staff: True")
            self.stdout.write("   - is_superuser: True")
            self.stdout.write("   - is_store_owner: False")
            self.stdout.write("")
            self.stdout.write("🏪 STORE_OWNER (매장 관리자):")
            self.stdout.write("   - is_staff: True")
            self.stdout.write("   - is_superuser: False")
            self.stdout.write("   - is_store_owner: True")
            self.stdout.write("")
            self.stdout.write("👤 USER/GUEST (일반/게스트 사용자):")
            self.stdout.write("   - is_staff: False")
            self.stdout.write("   - is_superuser: False")
            self.stdout.write("   - is_store_owner: False") 