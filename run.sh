#!/bin/bash

# 백엔드 실행
cd backend
source .venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!
echo "백엔드가 PID $BACKEND_PID로 실행되었습니다."

# 프론트엔드 실행
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "프론트엔드가 PID $FRONTEND_PID로 실행되었습니다."

# CTRL+C로 종료 처리
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
echo "CTRL+C를 눌러 종료할 수 있습니다."

# 프로세스가 실행 중인 동안 대기
wait 