#!/bin/bash

# QR 코드 문제 해결을 위한 배포 스크립트
# 사용법: ./deploy/fix_qr_code_issue.sh

echo "=== ASL 홀덤 QR 코드 문제 해결 배포 스크립트 ==="
echo "시작 시간: $(date)"

# 현재 디렉토리 확인
if [ ! -f "manage.py" ]; then
    echo "❌ 오류: Django 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 가상환경 활성화 확인
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  가상환경이 활성화되지 않았습니다. .venv 활성화를 시도합니다..."
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        echo "✅ 가상환경 활성화 완료"
    else
        echo "❌ 가상환경을 찾을 수 없습니다. 수동으로 활성화해주세요."
        exit 1
    fi
fi

# 코드 변경사항 확인
echo "📋 변경된 파일 목록:"
echo "- backend/accounts/models.py (QR 코드 생성 메서드 수정)"
echo "- backend/views/user_views.py (API 오류 처리 개선)"
echo "- frontend-v1/src/mobile/pages/user/QRCode.jsx (UI 개선)"
echo "- backend/accounts/management/commands/generate_missing_qr_codes.py (관리 명령어 추가)"

# 백엔드 의존성 확인
echo ""
echo "📦 의존성 확인 중..."
pip install -r backend/requirements.txt

# 데이터베이스 마이그레이션 확인
echo ""
echo "🗄️  데이터베이스 마이그레이션 확인 중..."
cd backend
python manage.py makemigrations
python manage.py migrate

# 기존 사용자들의 QR 코드 생성
echo ""
echo "🔄 기존 사용자들의 누락된 QR 코드 생성 중..."
python manage.py generate_missing_qr_codes

# 미디어 디렉토리 권한 설정
echo ""
echo "📁 미디어 디렉토리 권한 설정 중..."
mkdir -p media/qr_codes
chmod 755 media
chmod 755 media/qr_codes

# 정적 파일 수집
echo ""
echo "📋 정적 파일 수집 중..."
python manage.py collectstatic --noinput

# 서버 재시작 (gunicorn 사용 시)
echo ""
echo "🔄 서버 재시작 중..."
if pgrep -f "gunicorn" > /dev/null; then
    echo "Gunicorn 프로세스를 재시작합니다..."
    pkill -f "gunicorn"
    sleep 2
    
    # Gunicorn 재시작 (백그라운드에서 실행)
    nohup gunicorn --bind 0.0.0.0:8000 asl_holdem.wsgi:application > gunicorn.log 2>&1 &
    echo "✅ Gunicorn 재시작 완료"
else
    echo "ℹ️  Gunicorn 프로세스를 찾을 수 없습니다. 수동으로 서버를 시작해주세요."
fi

cd ..

echo ""
echo "🎉 QR 코드 문제 해결 배포 완료!"
echo "완료 시간: $(date)"
echo ""
echo "📝 확인 사항:"
echo "1. 사용자 앱에서 QR 코드 페이지 접속 테스트"
echo "2. QR 코드 이미지가 정상적으로 표시되는지 확인"
echo "3. 새로운 사용자 등록 시 QR 코드 자동 생성 테스트"
echo "4. 매장 관리자의 QR 코드 스캔 기능 테스트"
echo ""
echo "❓ 문제가 지속되면 다음 명령어로 로그를 확인하세요:"
echo "   tail -f backend/gunicorn.log"
echo "   python backend/manage.py shell"
echo ""
echo "화이팅! 🚀" 