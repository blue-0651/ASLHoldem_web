#!/bin/bash

# 로그 출력을 위한 함수
log_with_prefix() {
  local prefix="$1"
  while read -r line; do
    echo "[$prefix] $line"
  done
}

# 현재 IP 주소 감지 (안드로이드 접속용)
get_local_ip() {
  # macOS/Linux에서 로컬 IP 주소 가져오기
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
  else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
  fi
  echo $LOCAL_IP
}

LOCAL_IP=$(get_local_ip)
echo "감지된 로컬 IP: $LOCAL_IP"
echo "안드로이드에서 접속할 때는 http://$LOCAL_IP:3000 을 사용하세요"

# 포트 8000이 사용중인지 확인하고 사용중이면 종료
echo "포트 8000 사용 여부 확인 중..."
PORT_PID=$(lsof -ti:8000)
if [ ! -z "$PORT_PID" ]; then
  echo "포트 8000이 이미 사용 중입니다. PID: $PORT_PID - 해당 프로세스를 종료합니다."
  kill -9 $PORT_PID
  sleep 2 # 프로세스가 완전히 종료될 때까지 잠시 대기
fi

# 백엔드 실행
cd backend
source .venv/bin/activate
# 백엔드 실행 및 로그에 [BACKEND] 접두사 추가 (모든 IP에서 접근 가능하도록 0.0.0.0:8000으로 실행)
python manage.py runserver 0.0.0.0:8000 2>&1 | log_with_prefix "BACKEND" &
BACKEND_PID=$!
echo "백엔드가 PID $BACKEND_PID로 실행되었습니다."

# 프론트엔드 실행
cd ../frontend-v1
# 환경 변수 설정 (안드로이드 접속 지원)
export VITE_API_URL="http://$LOCAL_IP:8000"
echo "API URL 설정: $VITE_API_URL"
# 프론트엔드 실행 및 로그에 [FRONTEND] 접두사 추가
npm start 2>&1 | log_with_prefix "FRONTEND" &
FRONTEND_PID=$!
echo "프론트엔드가 PID $FRONTEND_PID로 실행되었습니다."

# CTRL+C로 종료 처리
trap "kill $BACKEND_PID $FRONTEND_PID; echo '모든 프로세스가 종료되었습니다.'; exit" INT
echo "CTRL+C를 눌러 종료할 수 있습니다."

# 프로세스가 실행 중인 동안 대기
wait 