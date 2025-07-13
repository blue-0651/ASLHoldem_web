#!/usr/bin/env python
"""
배너 이미지 업로드 권한 문제 해결 스크립트
배포서버에서 실행하여 media 디렉토리 권한을 확인하고 수정합니다.

사용법:
  python fix_banner_permissions.py          # 권한 확인
  python fix_banner_permissions.py --fix    # 권한 수정
  python fix_banner_permissions.py --test   # 테스트 파일 생성
"""

import os
import sys
import stat
import subprocess
import tempfile
from pathlib import Path
import pwd
import grp
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('banner_permissions_fix.log')
    ]
)
logger = logging.getLogger(__name__)

def check_directory_permissions(path):
    """디렉토리 권한 확인"""
    if not os.path.exists(path):
        return False, f"디렉토리가 존재하지 않습니다: {path}"
    
    try:
        # 디렉토리 정보 가져오기
        stat_info = os.stat(path)
        mode = stat_info.st_mode
        
        # 소유자 정보 가져오기
        try:
            owner_name = pwd.getpwuid(stat_info.st_uid).pw_name
        except KeyError:
            owner_name = f"UID:{stat_info.st_uid}"
        
        try:
            group_name = grp.getgrgid(stat_info.st_gid).gr_name
        except KeyError:
            group_name = f"GID:{stat_info.st_gid}"
        
        # 권한 정보
        permissions = {
            'readable': os.access(path, os.R_OK),
            'writable': os.access(path, os.W_OK),
            'executable': os.access(path, os.X_OK),
            'owner': stat_info.st_uid,
            'group': stat_info.st_gid,
            'owner_name': owner_name,
            'group_name': group_name,
            'mode': oct(mode)[-3:],  # 마지막 3자리 권한
            'full_mode': oct(mode)
        }
        
        return True, permissions
    except Exception as e:
        return False, f"권한 확인 실패: {str(e)}"

def fix_directory_permissions(path):
    """디렉토리 권한 수정"""
    try:
        # 디렉토리 생성 (존재하지 않는 경우)
        os.makedirs(path, exist_ok=True)
        
        # 소유자를 asl_holdem:www-data로 변경
        subprocess.run(['sudo', 'chown', '-R', 'asl_holdem:www-data', path], check=True)
        
        # 권한을 775로 설정 (소유자와 그룹이 읽기/쓰기/실행 가능)
        subprocess.run(['sudo', 'chmod', '-R', '775', path], check=True)
        
        return True, f"권한 수정 성공: {path}"
    except subprocess.CalledProcessError as e:
        return False, f"권한 수정 실패: {str(e)}"
    except Exception as e:
        return False, f"권한 수정 중 오류 발생: {str(e)}"

def check_django_settings():
    """Django 설정 확인"""
    try:
        # Django 설정 import
        import django
        from django.conf import settings
        
        # Django 설정 로드
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'asl_holdem.settings')
        django.setup()
        
        info = {
            'MEDIA_ROOT': getattr(settings, 'MEDIA_ROOT', 'Not set'),
            'MEDIA_URL': getattr(settings, 'MEDIA_URL', 'Not set'),
            'DEBUG': getattr(settings, 'DEBUG', 'Not set'),
            'STATIC_ROOT': getattr(settings, 'STATIC_ROOT', 'Not set'),
            'BASE_DIR': getattr(settings, 'BASE_DIR', 'Not set')
        }
        
        return True, info
    except Exception as e:
        return False, f"Django 설정 확인 실패: {str(e)}"

def test_file_upload(media_path):
    """파일 업로드 테스트"""
    try:
        # 테스트 파일 생성
        test_file_path = os.path.join(media_path, 'banner_images', 'test_upload.txt')
        
        # 디렉토리 생성
        os.makedirs(os.path.dirname(test_file_path), exist_ok=True)
        
        # 테스트 파일 작성
        with open(test_file_path, 'w') as f:
            f.write('배너 업로드 테스트 파일\n')
            f.write(f'생성 시간: {os.popen("date").read()}')
        
        # 파일 권한 확인
        if os.path.exists(test_file_path):
            file_stat = os.stat(test_file_path)
            return True, {
                'file_path': test_file_path,
                'file_size': file_stat.st_size,
                'file_mode': oct(file_stat.st_mode)[-3:],
                'file_owner': pwd.getpwuid(file_stat.st_uid).pw_name,
                'file_group': grp.getgrgid(file_stat.st_gid).gr_name
            }
        else:
            return False, "테스트 파일 생성 실패"
            
    except Exception as e:
        return False, f"파일 업로드 테스트 실패: {str(e)}"

def check_web_server_config():
    """웹 서버 설정 확인"""
    try:
        nginx_config_paths = [
            '/etc/nginx/sites-available/asl_holdem',
            '/etc/nginx/sites-enabled/asl_holdem',
            '/etc/nginx/nginx.conf'
        ]
        
        config_info = {}
        for path in nginx_config_paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    content = f.read()
                    config_info[path] = {
                        'exists': True,
                        'size': len(content),
                        'contains_media': '/media/' in content,
                        'contains_client_max_body_size': 'client_max_body_size' in content
                    }
            else:
                config_info[path] = {'exists': False}
        
        return True, config_info
    except Exception as e:
        return False, f"웹 서버 설정 확인 실패: {str(e)}"

def main():
    """메인 실행 함수"""
    
    # 프로젝트 루트 디렉토리 찾기
    current_dir = Path(__file__).parent
    project_root = current_dir
    
    # 확인할 디렉토리 목록
    media_dirs = [
        project_root / 'media',
        project_root / 'media' / 'banner_images',
        project_root / 'static'
    ]
    
    fix_mode = '--fix' in sys.argv
    test_mode = '--test' in sys.argv
    
    print("=" * 60)
    print("🔍 배너 이미지 업로드 권한 확인 도구 (향상된 버전)")
    print("=" * 60)
    
    # 1. Django 설정 확인
    print("\n🔧 Django 설정 확인:")
    django_success, django_info = check_django_settings()
    if django_success:
        for key, value in django_info.items():
            print(f"  {key}: {value}")
    else:
        print(f"  ❌ {django_info}")
    
    # 2. 디렉토리 권한 확인
    print("\n📁 디렉토리 권한 확인:")
    all_ok = True
    
    for media_dir in media_dirs:
        print(f"\n📂 디렉토리: {media_dir}")
        
        success, result = check_directory_permissions(str(media_dir))
        
        if success:
            permissions = result
            print(f"  ✅ 존재: 예")
            print(f"  📖 읽기 권한: {'예' if permissions['readable'] else '❌ 아니오'}")
            print(f"  ✏️  쓰기 권한: {'예' if permissions['writable'] else '❌ 아니오'}")
            print(f"  🔧 실행 권한: {'예' if permissions['executable'] else '❌ 아니오'}")
            print(f"  👤 소유자: {permissions['owner_name']} (UID: {permissions['owner']})")
            print(f"  👥 그룹: {permissions['group_name']} (GID: {permissions['group']})")
            print(f"  🔒 권한 모드: {permissions['mode']} (전체: {permissions['full_mode']})")
            
            # 권한 문제 확인
            if not permissions['writable']:
                print(f"  ❌ 쓰기 권한이 없습니다!")
                all_ok = False
            if permissions['owner_name'] != 'asl_holdem':
                print(f"  ⚠️  소유자가 'asl_holdem'이 아닙니다!")
                all_ok = False
        else:
            print(f"  ❌ {result}")
            all_ok = False
        
        # 권한 수정 모드인 경우
        if fix_mode:
            print(f"  🔧 권한 수정 시도...")
            fix_success, fix_result = fix_directory_permissions(str(media_dir))
            if fix_success:
                print(f"  ✅ {fix_result}")
            else:
                print(f"  ❌ {fix_result}")
    
    # 3. 웹 서버 설정 확인
    print("\n🌐 웹 서버 설정 확인:")
    web_success, web_info = check_web_server_config()
    if web_success:
        for path, info in web_info.items():
            if info['exists']:
                print(f"  📄 {path}: 존재")
                print(f"    - 크기: {info['size']} bytes")
                print(f"    - Media 설정: {'있음' if info['contains_media'] else '없음'}")
                print(f"    - 업로드 크기 제한: {'있음' if info['contains_client_max_body_size'] else '없음'}")
            else:
                print(f"  ❌ {path}: 존재하지 않음")
    else:
        print(f"  ❌ {web_info}")
    
    # 4. 파일 업로드 테스트
    if test_mode:
        print("\n📤 파일 업로드 테스트:")
        test_success, test_result = test_file_upload(str(project_root / 'media'))
        if test_success:
            print(f"  ✅ 테스트 파일 생성 성공")
            print(f"    - 파일 경로: {test_result['file_path']}")
            print(f"    - 파일 크기: {test_result['file_size']} bytes")
            print(f"    - 파일 권한: {test_result['file_mode']}")
            print(f"    - 파일 소유자: {test_result['file_owner']}")
            print(f"    - 파일 그룹: {test_result['file_group']}")
        else:
            print(f"  ❌ {test_result}")
    
    # 5. 결과 요약
    print("\n" + "=" * 60)
    
    if all_ok:
        print("✅ 모든 디렉토리 권한이 정상입니다!")
    else:
        print("❌ 일부 디렉토리에 권한 문제가 있습니다.")
        print("\n🔧 권한 수정 방법:")
        print("1. 수동 수정:")
        print("   sudo mkdir -p media/banner_images")
        print("   sudo chown -R asl_holdem:www-data media/")
        print("   sudo chmod -R 775 media/")
        print("\n2. 자동 수정:")
        print("   sudo python fix_banner_permissions.py --fix")
    
    print("\n💡 추가 확인사항:")
    print("- nginx 설정: /etc/nginx/sites-available/asl_holdem")
    print("- Django 설정: settings.py의 MEDIA_ROOT, MEDIA_URL")
    print("- 서비스 재시작: sudo supervisorctl restart asl_holdem")
    print("- 로그 확인: sudo supervisorctl tail -f asl_holdem")
    
    print("\n🔍 배너 업로드 테스트 방법:")
    print("1. 브라우저에서 관리자 로그인")
    print("2. 배너 관리 페이지에서 새 배너 생성")
    print("3. 개발자 도구 Console에서 FormData 로그 확인")
    print("4. Network 탭에서 API 응답 확인")
    
    print("\n🚨 운영환경 디버깅:")
    print("- 프론트엔드 Console 로그 확인 (F12)")
    print("- 백엔드 로그: sudo supervisorctl tail -f asl_holdem")
    print("- Nginx 에러 로그: sudo tail -f /var/log/nginx/error.log")

if __name__ == "__main__":
    main() 