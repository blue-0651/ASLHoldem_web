# 🚀 ASL Holdem 안드로이드 - Localhost 연결 가이드

## 📋 현재 설정 상태

### ✅ 완료된 설정
- **안드로이드 IP 주소**: `192.168.239.142:3000` ✓
- **네트워크 보안 설정**: cleartext traffic 허용 ✓ 
- **WebView 설정**: 로컬 개발환경 최적화 ✓
- **권한 처리**: 유연한 권한 시스템 ✓
- **CORS 설정**: 백엔드에서 모든 origin 허용 ✓

### 🔧 실행 중인 서비스
```bash
프론트엔드: http://192.168.239.142:3000 (Vite 개발서버)
백엔드: http://127.0.0.1:8000 (Django 개발서버)
```

## 📱 안드로이드 앱 실행 단계

### 1. APK 설치
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. 실행 흐름
1. **스플래시 화면** (2초) - ASL HOLDEM 로고
2. **권한 체크** - 카메라, 저장소, 위치 권한 요청
   - "권한 허용하기" 또는 "일단 시작하기" 선택 가능
3. **Advertisement 페이지** - WebView로 바로 로드

### 3. 예상 URL
```
http://192.168.239.142:3000/mobile/advertisement
```

## 🐛 디버깅 정보

### 로그 확인
```bash
# 안드로이드 로그 실시간 확인
adb logcat | grep -E "(MainActivity|WebViewScreen)"

# 주요 로그 태그
- MainActivity: URL 정보 및 BuildConfig 값
- WebViewScreen: 페이지 로딩 상태 및 오류
```

### 주요 로그 메시지
```
D/MainActivity: WebView URL: http://192.168.239.142:3000/mobile/advertisement
D/MainActivity: BASE_URL: http://192.168.239.142:3000
D/MainActivity: API_URL: http://192.168.239.142:8000
D/WebViewScreen: Page started loading: http://192.168.239.142:3000/mobile/advertisement
D/WebViewScreen: Page finished loading: http://192.168.239.142:3000/mobile/advertisement
```

## 🛠️ 문제 해결

### IP 주소 변경 시
1. 현재 IP 확인:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. `android/app/build.gradle` 수정:
```gradle
buildConfigField "String", "BASE_URL", '"http://[새IP주소]:3000"'
buildConfigField "String", "API_URL", '"http://[새IP주소]:8000"'
```

3. `android/app/src/main/res/xml/network_security_config.xml` 수정:
```xml
<domain includeSubdomains="false">[새IP주소]</domain>
```

4. 다시 빌드:
```bash
cd android && ./gradlew assembleDebug
```

### 연결 실패 시 체크리스트
- [ ] 프론트엔드가 `http://192.168.239.142:3000`에서 실행 중인가?
- [ ] 백엔드가 `http://127.0.0.1:8000`에서 실행 중인가?
- [ ] 방화벽에서 포트 3000이 허용되어 있는가?
- [ ] 안드로이드 기기와 개발 PC가 같은 네트워크에 있는가?
- [ ] WebView에서 JavaScript가 활성화되어 있는가?

### WebView 캐시 클리어
앱에서 이전 캐시로 인한 문제가 있을 경우:
```bash
# 앱 데이터 클리어 (설정 > 앱 > ASL HOLDEM > 저장공간 > 데이터 삭제)
# 또는 새로 설치
adb uninstall com.asl.holdem
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 🌐 네트워크 설정 세부사항

### Android Network Security Config
```xml
<!-- 로컬 개발환경 허용 -->
<domain includeSubdomains="false">192.168.239.142</domain>
<domain includeSubdomains="false">localhost</domain>
<domain includeSubdomains="false">127.0.0.1</domain>
```

### WebView 설정
```kotlin
// 로컬 개발환경 최적화
mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
cacheMode = WebSettings.LOAD_NO_CACHE
userAgentString = userAgentString + " ASLHoldemApp/1.0"
```

## 📞 지원 및 문의

웹앱 연결에 문제가 있을 경우:
1. 위의 디버깅 단계를 따라해보세요
2. 로그 정보를 확인해보세요
3. 네트워크 연결을 확인해보세요

**화이팅! 🎉** 