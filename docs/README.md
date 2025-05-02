# ASL Holdem 문서

## API 문서

`API_Collection.json` 파일에는 ASL Holdem 서비스의 API 문서가 포함되어 있습니다. 이 파일은 Postman 컬렉션 형식으로 작성되었습니다.

### API 목록

- 토너먼트 관련 API
- 매장 관련 API
- 사용자 관련 API
- 등록 관련 API
- 대시보드 관련 API

### 사용 방법

1. Postman 애플리케이션을 설치합니다.
2. `File > Import`를 클릭합니다.
3. `API_Collection.json` 파일을 선택합니다.
4. 컬렉션이 Postman에 로드됩니다.
5. 필요한 경우 환경 변수를 설정합니다:
   - `base_url`: API 서버 주소 (기본값: `http://localhost:8000`)

### 인증

대부분의 API는 인증이 필요합니다. 사용자 로그인 API를 통해 토큰을 먼저 얻어야 합니다. 