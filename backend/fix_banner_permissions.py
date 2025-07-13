#!/usr/bin/env python
"""
배너 이미지 업로드 권한 문제 해결 스크립트
배포서버에서 실행하여 media 디렉토리 권한을 확인하고 수정합니다.

사용법:
  python fix_banner_permissions.py          # 권한 확인
  python fix_banner_permissions.py --fix    # 권한 수정
"""

import os
import sys
import stat
import subprocess
from pathlib import Path

def check_directory_permissions(path):
    """디렉토리 권한 확인"""
    if not os.path.exists(path):
        return False, f"디렉토리가 존재하지 않습니다: {path}"
    
    try:
        # 디렉토리 정보 가져오기
        stat_info = os.stat(path)
        mode = stat_info.st_mode
        
        # 권한 정보
        permissions = {
            'readable': os.access(path, os.R_OK),
            'writable': os.access(path, os.W_OK),
            'executable': os.access(path, os.X_OK),
            'owner': stat_info.st_uid,
            'group': stat_info.st_gid,
            'mode': oct(mode)[-3:]  # 마지막 3자리 권한
        }
        
        return True, permissions
    except Exception as e:
        return False, f"권한 확인 실패: {str(e)}"

def fix_directory_permissions(path, owner='www-data', group='www-data', mode='755'):
    """디렉토리 권한 수정"""
    try:
        # 디렉토리 생성 (없는 경우)
        os.makedirs(path, exist_ok=True)
        
        # 권한 변경
        os.chmod(path, int(mode, 8))
        
        # 소유자 변경
        subprocess.run(['chown', f'{owner}:{group}', path], check=True)
        
        return True, f"권한 수정 완료: {path}"
    except Exception as e:
        return False, f"권한 수정 실패: {str(e)}"

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
    
    print("=" * 60)
    print("🔍 배너 이미지 업로드 권한 확인 도구")
    print("=" * 60)
    
    all_ok = True
    
    for media_dir in media_dirs:
        print(f"\n📁 디렉토리: {media_dir}")
        
        success, result = check_directory_permissions(str(media_dir))
        
        if success:
            permissions = result
            print(f"  ✅ 존재: 예")
            print(f"  📖 읽기 권한: {'예' if permissions['readable'] else '❌ 아니오'}")
            print(f"  ✏️  쓰기 권한: {'예' if permissions['writable'] else '❌ 아니오'}")
            print(f"  🔧 실행 권한: {'예' if permissions['executable'] else '❌ 아니오'}")
            print(f"  👤 소유자 UID: {permissions['owner']}")
            print(f"  👥 그룹 GID: {permissions['group']}")
            print(f"  🔒 권한 모드: {permissions['mode']}")
            
            # 권한 문제 확인
            if not permissions['writable']:
                print(f"  ❌ 쓰기 권한이 없습니다!")
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
    
    print("\n" + "=" * 60)
    
    if all_ok:
        print("✅ 모든 디렉토리 권한이 정상입니다!")
    else:
        print("❌ 일부 디렉토리에 권한 문제가 있습니다.")
        print("\n🔧 권한 수정 방법:")
        print("1. 수동 수정:")
        print("   sudo mkdir -p media/banner_images")
        print("   sudo chown -R www-data:www-data media/")
        print("   sudo chmod -R 755 media/")
        print("\n2. 자동 수정:")
        print("   sudo python fix_banner_permissions.py --fix")
    
    print("\n💡 추가 확인사항:")
    print("- nginx 설정: /etc/nginx/sites-available/asl_holdem")
    print("- Django 설정: settings.py의 MEDIA_ROOT, MEDIA_URL")
    print("- 서버 재시작: sudo supervisorctl restart asl_holdem")

if __name__ == "__main__":
    main() 