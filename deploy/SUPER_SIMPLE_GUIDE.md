# 🚀 ASL Holdem 초간단 배포 가이드

## 📌 딱 3단계로 끝!

### 1단계: Vultr 서버 생성 (5분)
1. [Vultr.com](https://vultr.com)에 가입/로그인
2. "Deploy New Server" 클릭
3. 다음 설정 선택:
   - **지역**: Seoul (서울)
   - **서버 타입**: Regular Performance
   - **운영체제**: Ubuntu 22.04 LTS
   - **플랜**: $12/월 (2GB RAM) - 권장
4. "Deploy Now" 클릭
5. 서버 생성 완료까지 1-2분 대기

### 2단계: 서버 접속 (1분)
1. 터미널(Mac) 또는 PuTTY(Windows)로 접속:
   ```bash
   ssh root@141.164.36.65
   ```
2. 처음 접속시 비밀번호는 Vultr 대시보드에서 확인
3. 서버 IP: **141.164.36.65**
4. 도메인: **www.kasl.co.kr**

### 3단계: 원클릭 배포 실행 (10분)
서버에 접속한 후, 아래 **한 줄**만 복사해서 붙여넣기:

```bash
curl -fsSL https://raw.githubusercontent.com/blue-0651/ASLHoldem_web/master/deploy/one_click_deploy.sh | bash
```

그러면 자동으로:
- ✅ 시스템 업데이트
- ✅ 필수 프로그램 설치
- ✅ 데이터베이스 설정
- ✅ 웹서버 설정
- ✅ 프로젝트 다운로드 및 설치
- ✅ 모든 서비스 시작

## 🎉 완료!

배포가 끝나면 웹사이트에 접속할 수 있습니다:
- **메인 사이트**: http://www.kasl.co.kr 또는 http://141.164.36.65
- **관리자 페이지**: http://www.kasl.co.kr/admin/ 또는 http://141.164.36.65/admin/

---

## 🆘 문제 해결

### Q: 스크립트 실행 중 오류가 났어요
```bash
# 로그 확인
sudo supervisorctl tail -f asl_holdem
sudo tail -f /var/log/nginx/error.log
```

### Q: 웹사이트가 안 열려요
```bash
# 서비스 상태 확인
sudo supervisorctl status asl_holdem
sudo systemctl status nginx
```

### Q: 관리자 계정을 만들고 싶어요
```bash
cd /var/www/asl_holdem/backend
sudo -u asl_holdem .venv/bin/python manage.py createsuperuser
```

---

## 🔒 도메인 설정 (선택사항)

도메인이 있다면:
1. 도메인 DNS 설정에서 A 레코드를 서버 IP로 설정
2. SSL 인증서 설치:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 📞 도움이 필요하면

1. **로그 확인**: `sudo supervisorctl tail -f asl_holdem`
2. **서비스 재시작**: `sudo supervisorctl restart asl_holdem`
3. **Nginx 재시작**: `sudo systemctl restart nginx`

**배포 정보 파일**: `/var/www/asl_holdem/DEPLOYMENT_INFO.txt`

---

**💡 팁**: 이 가이드를 저장해두고 언제든 참고하세요! 