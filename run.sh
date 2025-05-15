#!/bin/bash

# 로그 출력을 위한 함수
log_with_prefix() {
  local prefix="$1"
  while read -r line; do
    echo "[$prefix] $line"
  done
}

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
# 백엔드 실행 및 로그에 [BACKEND] 접두사 추가
python manage.py runserver 2>&1 | log_with_prefix "BACKEND" &
BACKEND_PID=$!
echo "백엔드가 PID $BACKEND_PID로 실행되었습니다."

# 프론트엔드 실행
cd ../frontend
# 프론트엔드 실행 및 로그에 [FRONTEND] 접두사 추가
npm start 2>&1 | log_with_prefix "FRONTEND" &
FRONTEND_PID=$!
echo "프론트엔드가 PID $FRONTEND_PID로 실행되었습니다."

# CTRL+C로 종료 처리
trap "kill $BACKEND_PID $FRONTEND_PID; echo '모든 프로세스가 종료되었습니다.'; exit" INT
echo "CTRL+C를 눌러 종료할 수 있습니다."

# 프로세스가 실행 중인 동안 대기
wait 