# ASL Holdem Android App

ASL Holdem 프로젝트의 안드로이드 하이브리드 앱입니다.

## 🏗️ 프로젝트 구조

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/asl/holdem/
│   │   │   ├── ASLApplication.kt           # 앱 Application 클래스
│   │   │   └── ui/
│   │   │       ├── main/                     # 메인 액티비티 및 컴포넌트
│   │   │       │   ├── MainActivity.kt       # 메인 액티비티
│   │   │       │   ├── MainViewModel.kt      # 메인 뷰모델
│   │   │       │   └── components/           # UI 컴포넌트들
│   │   │       │       ├── WebViewScreen.kt  # WebView 컴포넌트
│   │   │       │       └── UserTypeSelector.kt # 사용자 타입 선택
│   │   │       ├── splash/                   # 스플래시 화면
│   │   │       │   └── SplashActivity.kt     # 스플래시 액티비티
│   │   │       └── theme/                    # Material3 테마
│   │   │           ├── Color.kt              # 컬러 팔레트
│   │   │           ├── Theme.kt              # 테마 정의
│   │   │           └── Type.kt               # 타이포그래피
│   │   ├── res/                              # 리소스 파일들
│   │   └── AndroidManifest.xml               # 매니페스트
│   ├── build.gradle                          # 앱 빌드 설정
│   └── proguard-rules.pro                    # ProGuard 규칙
├── build.gradle                              # 프로젝트 빌드 설정
├── gradle.properties                         # Gradle 속성
└── settings.gradle                           # Gradle 설정
```

## 🎯 주요 기능

### 1. 하이브리드 앱 구조
- **WebView 기반**: React 웹앱을 WebView로 표시
- **사용자 타입 구분**: 일반사용자 vs 매장관리자
- **네이티브 기능**: 권한 관리, 네트워크 상태 확인

### 2. 현대적인 안드로이드 개발
- **Jetpack Compose**: 선언형 UI
- **Material Design 3**: 최신 디자인 시스템
- **Hilt**: 의존성 주입
- **MVVM 패턴**: 아키텍처 패턴
- **StateFlow**: 상태 관리

### 3. 웹뷰 최적화
- **JavaScript 지원**: 완전한 웹앱 호환
- **파일 업로드**: 카메라/갤러리 접근
- **캐시 관리**: 성능 최적화
- **에러 처리**: 네트워크 오류 대응

## 🛠️ 기술 스택

### Core
- **Language**: Kotlin
- **UI**: Jetpack Compose
- **Architecture**: MVVM + Repository Pattern
- **DI**: Hilt
- **Build**: Gradle with Kotlin DSL

### Dependencies
- **Compose BOM**: 2024.02.00
- **Material3**: 최신 Material Design
- **WebView**: androidx.webkit
- **Navigation**: Compose Navigation
- **Accompanist**: SystemUI, WebView, Permissions
- **Networking**: Retrofit2 + OkHttp3
- **Splash Screen**: androidx.core:core-splashscreen

## 📱 앱 구조

### 1. 스플래시 화면
- 앱 시작시 2초간 표시
- 향후 로고/애니메이션 추가 가능
- 자동으로 메인 액티비티로 이동

### 2. 사용자 타입 선택
- **일반 사용자**: 토너먼트 참가, 예약 관리
- **매장 관리자**: 매장 관리, 토너먼트 개설
- 언제든지 변경 가능

### 3. WebView 화면
- **일반 사용자**: `BASE_URL/mobile`
- **매장 관리자**: `BASE_URL/mobile/store`
- 로딩 인디케이터 표시
- 네트워크 오류 처리

## 🔧 빌드 및 실행

### 시스템 요구사항
- **Android Studio**: Arctic Fox 이상
- **Kotlin**: 1.9.22
- **Gradle**: 8.2.2
- **JDK**: 17
- **Android SDK**: API 24+ (Android 7.0)

### 빌드 설정
```bash
# 개발 빌드 (로컬 서버)
./gradlew assembleDebug

# 릴리즈 빌드 (운영 서버)
./gradlew assembleRelease
```

### 환경 설정
#### Debug 환경
```kotlin
BASE_URL = "http://192.168.1.100:3000"  // 로컬 개발 서버
API_URL = "http://192.168.1.100:8000"   // 로컬 API 서버
```

#### Release 환경
```kotlin
BASE_URL = "https://your-domain.com"    // 운영 웹서버
API_URL = "https://your-domain.com"     // 운영 API 서버
```

## 📋 권한

앱에서 사용하는 권한들:

```xml
<!-- 필수 권한 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- 선택 권한 -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: 포커 그린 (#1B5E20)
- **Secondary**: 골드 (#FF8F00)
- **Tertiary**: 레드 (#D32F2F)
- **Surface**: 밝은 배경 (#FFFBFE)

### 타이포그래피
- **Display**: 57sp ~ 36sp (헤더)
- **Headline**: 32sp ~ 24sp (제목)
- **Title**: 22sp ~ 14sp (서브 제목)
- **Body**: 16sp ~ 12sp (본문)
- **Label**: 14sp ~ 11sp (라벨)

## 🚀 배포

### APK 생성
```bash
# Debug APK
./gradlew assembleDebug

# Release APK (서명 필요)
./gradlew assembleRelease
```

### AAB 생성 (Google Play Store)
```bash
./gradlew bundleRelease
```

### 서명 설정
`app/build.gradle`에서 서명 설정 추가:
```kotlin
android {
    signingConfigs {
        release {
            storeFile file("path/to/keystore.jks")
            storePassword "store_password"
            keyAlias "key_alias"
            keyPassword "key_password"
        }
    }
}
```

## 🔄 웹앱 연동

### URL 구조
- **베이스 URL**: `BuildConfig.BASE_URL`
- **일반 사용자**: `/mobile`
- **매장 관리자**: `/mobile/store`

### User Agent
WebView에서 다음 User Agent 사용:
```
기본_User_Agent ASLHoldemApp/1.0
```

### JavaScript Bridge
필요시 웹앱과 네이티브 앱 간 통신을 위한 JavaScript Interface 추가 가능

## 📈 성능 최적화

### WebView 최적화
- JavaScript 활성화
- DOM 저장소 활성화
- 하드웨어 가속 활성화
- 캐시 관리 최적화

### 앱 크기 최적화
- ProGuard/R8 난독화
- 리소스 압축
- APK 분할 (향후)

## 🐛 디버깅

### 로그 확인
```bash
adb logcat | grep "ASLHoldem"
```

### WebView 디버깅
Chrome DevTools에서 `chrome://inspect` 접속

### 네트워크 디버깅
OkHttp Logging Interceptor 활성화 (Debug 빌드)

## 📝 향후 계획

### 1단계 (현재)
- ✅ 기본 하이브리드 앱 구조
- ✅ WebView 구현
- ✅ 사용자 타입 선택
- ✅ Material3 디자인

### 2단계 (예정)
- [ ] 푸시 알림 (FCM)
- [ ] 오프라인 모드
- [ ] 앱 내 업데이트
- [ ] 성능 모니터링

### 3단계 (계획)
- [ ] 생체 인증 로그인
- [ ] 다크 모드 지원
- [ ] 다국어 지원
- [ ] 접근성 개선

## 🤝 기여

프로젝트 기여 방법:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 라이선스

이 프로젝트는 ASL Holdem의 소유입니다.

---

**화이팅!** 🎯 