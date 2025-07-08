#!/bin/bash

# PostgreSQL 연결 진단 스크립트
# 141.164.36.65 서버용

SERVER_IP="141.164.36.65"
DB_USER="asl_user"
DB_PASSWORD="pppsss"
DB_NAME="asl_db"
DB_PORT="5432"

echo "=================================================="
echo "🔍 PostgreSQL 연결 진단 스크립트"
echo "=================================================="
echo "서버: $SERVER_IP"
echo "사용자: $DB_USER"
echo "데이터베이스: $DB_NAME"
echo "포트: $DB_PORT"
echo ""

echo "1. 서버에 SSH 접속하여 PostgreSQL 상태 확인..."
echo "명령어: ssh root@$SERVER_IP"
echo ""

echo "서버 접속 후 실행할 명령어들:"
echo ""

echo "🔧 PostgreSQL 서비스 상태 확인:"
echo "sudo systemctl status postgresql"
echo ""

echo "🔧 PostgreSQL 프로세스 확인:"
echo "sudo ps aux | grep postgres"
echo ""

echo "🔧 PostgreSQL 포트 확인:"
echo "sudo netstat -tlnp | grep 5432"
echo ""

echo "🔧 데이터베이스 사용자 확인:"
echo "sudo -u postgres psql -c \"\\du\""
echo ""

echo "🔧 asl_user 계정 확인:"
echo "sudo -u postgres psql -c \"\\du asl_user\""
echo ""

echo "🔧 데이터베이스 목록 확인:"
echo "sudo -u postgres psql -c \"\\l\""
echo ""

echo "🔧 asl_db 데이터베이스 확인:"
echo "sudo -u postgres psql -c \"\\l asl_db\""
echo ""

echo "🔧 로컬에서 데이터베이스 접속 테스트:"
echo "PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c \"SELECT current_user, current_database(), version();\""
echo ""

echo "🔧 외부에서 데이터베이스 접속 테스트 (다른 터미널에서):"
echo "PGPASSWORD=$DB_PASSWORD psql -h $SERVER_IP -U $DB_USER -d $DB_NAME -c \"SELECT current_user;\""
echo ""

echo "🔧 PostgreSQL 설정 파일 확인:"
echo "sudo find /etc/postgresql -name postgresql.conf -exec cat {} \\; | grep listen_addresses"
echo ""

echo "🔧 pg_hba.conf 파일 확인:"
echo "sudo find /etc/postgresql -name pg_hba.conf -exec cat {} \\;"
echo ""

echo "🔧 방화벽 상태 확인:"
echo "sudo ufw status"
echo "sudo iptables -L | grep 5432"
echo ""

echo "🔧 Django 설정에서 데이터베이스 정보 확인:"
echo "cd /var/www/asl_holdem/backend"
echo "python3 manage.py shell -c \"
from django.conf import settings
db = settings.DATABASES['default']
print('Django DB Settings:')
for key, value in db.items():
    print(f'{key}: {value}')
\""
echo ""

echo "=================================================="
echo "🛠️ 문제 해결 방법들"
echo "=================================================="
echo ""

echo "📝 1. PostgreSQL이 외부 접속을 허용하도록 설정:"
echo "sudo nano /etc/postgresql/*/main/postgresql.conf"
echo "# listen_addresses = 'localhost' 를 찾아서"
echo "# listen_addresses = '*' 로 변경"
echo ""

echo "📝 2. pg_hba.conf에서 외부 접속 허용:"
echo "sudo nano /etc/postgresql/*/main/pg_hba.conf"
echo "# 맨 아래에 추가:"
echo "# host    all             all             0.0.0.0/0               md5"
echo ""

echo "📝 3. 방화벽에서 PostgreSQL 포트 열기:"
echo "sudo ufw allow 5432"
echo ""

echo "📝 4. PostgreSQL 서비스 재시작:"
echo "sudo systemctl restart postgresql"
echo ""

echo "📝 5. asl_user 비밀번호 재설정 (필요시):"
echo "sudo -u postgres psql -c \"ALTER USER asl_user PASSWORD '$DB_PASSWORD';\""
echo ""

echo "📝 6. 새 데이터베이스 사용자 생성 (필요시):"
echo "sudo -u postgres psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';\""
echo "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
echo ""

echo "=================================================="
echo "🌐 DBeaver 연결 설정"
echo "=================================================="
echo "호스트: $SERVER_IP"
echo "포트: $DB_PORT"
echo "데이터베이스: $DB_NAME"
echo "사용자명: $DB_USER"
echo "비밀번호: $DB_PASSWORD"
echo ""
echo "연결 테스트를 먼저 실행해보세요!"
echo "" 