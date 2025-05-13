# ASL Holdem V1 프론트엔드

React 기반 ASL Holdem 프론트엔드 애플리케이션입니다.

## 설치 및 실행

1. 의존성 설치
   ```bash
   yarn install
   ```

2. 애플리케이션 실행
   ```bash
   npm start
   ```

3. 빌드
   ```bash
   npm run build
   ```

## 환경 설정

`.vite.config.mjs` 파일에 다음 환경 변수를 설정하세요:

```
  const PORT = `${'3000'}`;

  return {
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: PORT,
      host: '0.0.0.0', // 또는 host: true
    },
```

## 디렉토리 구조

- `public`: 정적 파일
- `src`: 소스 코드
    - `assets`: 이미지 및 리소스
    - `components`: 재사용 컴포넌트
    - `pages`: 페이지 컴포넌트
    - `utils`: 유틸리티 함수

## API 서비스

`src/utils/api.js` 파일에서 백엔드 API와의 통신을 처리합니다.

- `tournamentAPI`: 토너먼트 관련 API
- `storeAPI`: 매장 관련 API
- `registrationAPI`: 등록 관련 API
- `dashboardAPI`: 대시보드 관련 API 