#!/bin/bash

# 카카오맵 API 상태 테스트 스크립트
# 사용법: 배포서버에서 ./test_kakao_api.sh 실행

echo "=== 카카오맵 API 상태 테스트 시작 ==="
echo "시작 시간: $(date)"

API_KEY="b9bb383697165adaae1c916dd11cd401"

# 1. 카카오맵 API 서버 연결 테스트
echo "🌐 카카오맵 API 서버 연결 테스트..."
echo "📍 HTTPS 연결 테스트:"
curl -I "https://dapi.kakao.com/v2/maps/sdk.js?appkey=$API_KEY" 2>/dev/null | head -5

echo ""
echo "📍 HTTP 연결 테스트:"
curl -I "http://dapi.kakao.com/v2/maps/sdk.js?appkey=$API_KEY" 2>/dev/null | head -5

# 2. DNS 확인
echo ""
echo "🔍 DNS 확인:"
nslookup dapi.kakao.com

# 3. 네트워크 연결 확인
echo ""
echo "📡 네트워크 연결 확인:"
ping -c 3 dapi.kakao.com

# 4. 현재 웹사이트 상태 확인
echo ""
echo "🌍 현재 웹사이트 상태:"
curl -I http://kasl.co.kr/mobile/ 2>/dev/null | head -5

# 5. 프론트엔드 index.html 확인
echo ""
echo "📄 프론트엔드 index.html 확인:"
PROJECT_DIR="/var/www/asl_holdem"
if [ -f "$PROJECT_DIR/frontend-v1/index.html" ]; then
    echo "✅ index.html 파일 존재"
    echo "📋 카카오맵 API 스크립트 태그:"
    grep -n "dapi.kakao.com" "$PROJECT_DIR/frontend-v1/index.html"
else
    echo "❌ index.html 파일 없음"
fi

# 6. 브라우저 호환성 체크
echo ""
echo "🌐 브라우저 User-Agent 시뮬레이션:"
echo "📱 모바일 Chrome:"
curl -s -A "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36" "https://dapi.kakao.com/v2/maps/sdk.js?appkey=$API_KEY" | head -3

echo ""
echo "🖥️ 데스크톱 Chrome:"
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" "https://dapi.kakao.com/v2/maps/sdk.js?appkey=$API_KEY" | head -3

echo ""
echo "✅ 카카오맵 API 테스트 완료!"
echo "완료 시간: $(date)"
echo ""
echo "🔧 문제가 발견되면 다음을 확인하세요:"
echo "1. 카카오 개발자 콘솔에서 API 키 상태 확인"
echo "2. 도메인 설정 확인 (kasl.co.kr 등록 여부)"
echo "3. 브라우저 캐시 삭제"
echo "4. HTTPS 설정 고려"
echo ""
echo "화이팅! 🚀" 