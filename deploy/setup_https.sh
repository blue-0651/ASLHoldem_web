#!/bin/bash

# HTTPS 설정 스크립트
# 사용법: 배포서버에서 ./setup_https.sh 실행

echo "=== ASL 홀덤 HTTPS 설정 시작 ==="
echo "시작 시간: $(date)"

# 1. Certbot 설치
echo "📦 Certbot 설치 중..."
apt update
apt install -y certbot python3-certbot-nginx

# 2. SSL 인증서 발급
echo "🔒 SSL 인증서 발급 중..."
# 도메인에 대한 SSL 인증서 발급 (자동으로 nginx 설정 수정)
certbot --nginx -d kasl.co.kr -d www.kasl.co.kr --non-interactive --agree-tos --email admin@kasl.co.kr

# 3. 자동 갱신 설정
echo "🔄 자동 갱신 설정 중..."
crontab -l > /tmp/crontab_backup
echo "0 3 * * * /usr/bin/certbot renew --quiet" >> /tmp/crontab_backup
crontab /tmp/crontab_backup

# 4. 방화벽 설정
echo "🔥 방화벽 설정 중..."
ufw allow 'Nginx Full'
ufw allow 443/tcp
ufw allow 80/tcp

# 5. Nginx 설정 확인
echo "🔍 Nginx 설정 확인 중..."
nginx -t

# 6. 서비스 재시작
echo "🔄 서비스 재시작 중..."
systemctl restart nginx
systemctl restart supervisor

# 7. 상태 확인
echo "📊 상태 확인 중..."
systemctl status nginx | head -10
echo ""
echo "📋 SSL 인증서 상태:"
certbot certificates

echo ""
echo "✅ HTTPS 설정 완료!"
echo "완료 시간: $(date)"
echo ""
echo "🌐 웹사이트 접속:"
echo "- HTTPS: https://kasl.co.kr"
echo "- HTTPS: https://www.kasl.co.kr"
echo ""
echo "화이팅! 🚀" 