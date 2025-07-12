#!/bin/bash

# DB 이관 작업 스크립트 (수정된 버전)
# 사용법: 배포서버에서 ./migrate_db_to_server_fixed.sh 실행

echo "=== ASL 홀덤 DB 이관 작업 시작 ==="
echo "시작 시간: $(date)"

# 1. 프로젝트 디렉토리 찾기
echo "📁 프로젝트 디렉토리 찾는 중..."
PROJECT_DIR=""

if [ -d "/var/www/asl_holdem" ]; then
    PROJECT_DIR="/var/www/asl_holdem"
elif [ -d "/var/www/ASLHoldem_web" ]; then
    PROJECT_DIR="/var/www/ASLHoldem_web"
elif [ -d "/root/ASLHoldem_web" ]; then
    PROJECT_DIR="/root/ASLHoldem_web"
elif [ -d "/home/ASLHoldem_web" ]; then
    PROJECT_DIR="/home/ASLHoldem_web"
else
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다."
    echo "현재 디렉토리에서 계속 진행합니다: $(pwd)"
    PROJECT_DIR=$(pwd)
fi

echo "✅ 프로젝트 디렉토리: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 2. 가상환경 설정
echo "📦 가상환경 설정 중..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 3. 기존 DB 백업 (안전장치)
echo "🔄 기존 DB 백업 중..."
cd backend
if [ -f "db.sqlite3" ]; then
    cp db.sqlite3 db.sqlite3.backup.$(date +%Y%m%d_%H%M%S)
fi

# 4. 기존 데이터 삭제
echo "🗑️  기존 데이터 삭제 중..."
python manage.py flush --noinput

# 5. 마이그레이션 적용
echo "🔄 마이그레이션 적용 중..."
python manage.py makemigrations
python manage.py migrate

# 6. 덤프 파일 로드
echo "📥 덤프 데이터 로드 중..."
if [ -f "/tmp/db_dump.json" ]; then
    cp /tmp/db_dump.json .
    python manage.py loaddata db_dump.json
    echo "✅ 데이터 로드 완료"
else
    echo "❌ 덤프 파일을 찾을 수 없습니다: /tmp/db_dump.json"
    exit 1
fi

# 7. 사용자 현황 확인
echo "👥 사용자 현황 확인 중..."
python manage.py shell -c "
from accounts.models import User
total = User.objects.count()
has_qr = User.objects.exclude(qr_code='').count()
no_qr = total - has_qr
print(f'총 사용자 수: {total}')
print(f'QR 코드 있는 사용자: {has_qr}')
print(f'QR 코드 없는 사용자: {no_qr}')
"

# 8. QR 코드 생성
echo "🔄 QR 코드 생성 중..."
python manage.py generate_missing_qr_codes --force

# 9. 미디어 파일 권한 설정
echo "📁 미디어 파일 권한 설정 중..."
mkdir -p media/qr_codes
chmod -R 755 media/
chown -R www-data:www-data media/ 2>/dev/null || chown -R $USER:$USER media/

# 10. 정적 파일 수집
echo "📋 정적 파일 수집 중..."
python manage.py collectstatic --noinput

# 11. 서버 재시작
echo "🔄 서버 재시작 중..."
systemctl restart gunicorn 2>/dev/null || echo "⚠️  gunicorn 재시작 실패 - 수동으로 재시작하세요"
systemctl restart nginx 2>/dev/null || echo "⚠️  nginx 재시작 실패 - 수동으로 재시작하세요"

# 12. 결과 확인
echo "📊 최종 결과 확인..."
python manage.py shell -c "
from accounts.models import User
total = User.objects.count()
has_qr = User.objects.exclude(qr_code='').count()
print(f'📊 이관 완료 결과:')
print(f'  - 총 사용자 수: {total}')
print(f'  - QR 코드 생성된 사용자: {has_qr}')
print(f'  - QR 코드 생성 성공률: {(has_qr/total*100):.1f}%' if total > 0 else '  - 사용자 없음')
"

echo "📁 QR 코드 파일 확인:"
ls -la media/qr_codes/ | head -5

echo ""
echo "🎉 DB 이관 작업 완료!"
echo "완료 시간: $(date)"
echo ""
echo "✅ 확인 사항:"
echo "1. 웹 애플리케이션 접속 테스트"
echo "2. 사용자 QR 코드 페이지 테스트"
echo "3. 로그인 기능 테스트"
echo ""
echo "화이팅! 🚀" 