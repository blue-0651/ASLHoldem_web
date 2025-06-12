# ASL Holdem 앱 설정 관리 가이드

## 📋 개요

이 프로젝트는 BuildConfig의 값들을 쉽게 수정할 수 있도록 간단한 설정 파일로 관리합니다.

## 🗂️ 설정 파일 구조

### 1. `gradle.properties`
개발 환경의 서버 URL을 관리합니다.
```properties
# API 서버 설정
BASE_URL_DEBUG=http://10.30.2.138:3000
API_URL_DEBUG=http://10.30.2.138:8000
```

### 2. `strings.xml`
API 엔드포인트 경로와 네트워크 관련 문자열을 관리합니다.
```xml
<!-- API 엔드포인트 -->
<string name="api_login">/auth/login</string>
<string name="api_register">/auth/register</string>
<string name="api_tournaments">/tournaments</string>
```

### 3. `AppConfig.kt`
BuildConfig 값들을 편리하게 사용할 수 있는 헬퍼 클래스입니다.

## 🔧 사용 방법

### 1. 개발 환경 URL 변경
`gradle.properties`에서 URL을 수정:
```properties
BASE_URL_DEBUG=http://192.168.1.100:3000
API_URL_DEBUG=http://192.168.1.100:8000
```

### 2. 코드에서 설정 사용
```kotlin
import com.asl.holdem.config.AppConfig

// URL 사용
val baseUrl = AppConfig.BASE_URL
val apiUrl = AppConfig.API_URL
val fullApiUrl = AppConfig.getFullApiUrl("/tournaments")

// 환경별 분기
if (AppConfig.isDebugBuild()) {
    // 디버그 모드에서만 실행
}
```

## 🎯 빌드 타입별 설정

### Debug
- gradle.properties의 DEBUG URL 사용
- 디버그 로그 활성화

### Release
- 하드코딩된 운영 서버 URL 사용
- 최적화 및 난독화 적용

## 🚀 빌드 명령어

```bash
# Debug 빌드
./gradlew assembleDebug

# Release 빌드
./gradlew assembleRelease
```

## ⚠️ 주의사항

1. **개발 URL 수정**: `gradle.properties`에서 로컬 개발 서버 IP 변경
2. **운영 URL**: Release 빌드의 URL은 `build.gradle`에서 직접 수정
3. **로컬 설정**: `local.properties`는 Git에 커밋하지 않음

## 📞 문의사항

설정 관리에 대한 문의사항이 있으시면 개발팀에 연락해주세요. 