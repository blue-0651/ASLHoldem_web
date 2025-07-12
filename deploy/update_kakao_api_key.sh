#!/bin/bash

# 카카오맵 API 키 업데이트 스크립트
# 사용법: ./update_kakao_api_key.sh [새로운_API_키]

echo "=== 카카오맵 API 키 업데이트 시작 ==="
echo "시작 시간: $(date)"

# 새로운 API 키 확인
NEW_API_KEY="$1"
if [ -z "$NEW_API_KEY" ]; then
    echo "❌ 새로운 API 키를 입력하세요."
    echo "사용법: ./update_kakao_api_key.sh [새로운_API_키]"
    echo "예시: ./update_kakao_api_key.sh abc123def456..."
    exit 1
fi

# 프로젝트 디렉토리 찾기
PROJECT_DIR="/var/www/asl_holdem"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다: $PROJECT_DIR"
    exit 1
fi

echo "✅ 프로젝트 디렉토리: $PROJECT_DIR"

# 기존 API 키 백업
echo "🔄 기존 설정 백업 중..."
cp "$PROJECT_DIR/frontend-v1/index.html" "$PROJECT_DIR/frontend-v1/index.html.backup.$(date +%Y%m%d_%H%M%S)"

# API 키 업데이트
echo "🔧 API 키 업데이트 중..."
OLD_API_KEY="b9bb383697165adaae1c916dd11cd401"

# index.html에서 API 키 교체
sed -i "s/$OLD_API_KEY/$NEW_API_KEY/g" "$PROJECT_DIR/frontend-v1/index.html"

# 업데이트 확인
echo "📋 업데이트 결과 확인:"
grep -n "dapi.kakao.com" "$PROJECT_DIR/frontend-v1/index.html"

# 새로운 API 키 테스트
echo "🧪 새로운 API 키 테스트 중..."
echo "📍 HTTPS 연결 테스트:"
curl -I "https://dapi.kakao.com/v2/maps/sdk.js?appkey=$NEW_API_KEY" 2>/dev/null | head -3

echo ""
echo "📍 HTTP 연결 테스트:"
curl -I "http://dapi.kakao.com/v2/maps/sdk.js?appkey=$NEW_API_KEY" 2>/dev/null | head -3

# 프론트엔드 빌드 및 배포
echo "🔨 프론트엔드 빌드 중..."
cd "$PROJECT_DIR/frontend-v1"
npm run build

# 권한 설정
echo "🔒 권한 설정 중..."
chmod -R 755 dist/
chown -R www-data:www-data dist/ 2>/dev/null || chown -R $USER:$USER dist/

# 서비스 재시작
echo "🔄 서비스 재시작 중..."
systemctl restart nginx
supervisorctl restart all

echo ""
echo "✅ 카카오맵 API 키 업데이트 완료!"
echo "완료 시간: $(date)"
echo ""
echo "🔧 새로운 API 키: $NEW_API_KEY"
echo "📋 백업 파일: $PROJECT_DIR/frontend-v1/index.html.backup.*"
echo ""
echo "🌐 테스트 방법:"
echo "1. 모바일에서 https://kasl.co.kr/mobile/ 접속"
echo "2. 매장지도 페이지에서 지도 로딩 확인"
echo "3. 브라우저 개발자 도구에서 오류 메시지 확인"
echo ""
echo "화이팅! 🚀" 