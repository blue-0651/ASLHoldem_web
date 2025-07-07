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

# ASL Holdem 웹 애플리케이션

## 📋 프로젝트 개요
ASL Holdem은 홀덤 매장 관리와 토너먼트 운영을 위한 통합 웹 애플리케이션입니다.

## 🏗️ 아키텍처
- **Backend**: Django REST Framework
- **Frontend**: React.js
- **Database**: PostgreSQL
- **Authentication**: JWT

## 🗺️ 카카오 지도 기능 (2025.01 신규 추가)

### 기능 개요
- **매장 위치 지도 표시**: 카카오 지도를 사용하여 모든 매장의 위치를 마커로 표시
- **사용자 위치 기반 서비스**: 사용자의 현재 위치를 파악하여 가까운 매장 찾기
- **매장 상태별 마커**: 영업중/휴업중 상태에 따른 마커 색상 구분
- **상세 정보 모달**: 매장 마커 클릭 시 상세 정보 표시

### 구현된 페이지
1. **매장 지도 페이지** (`/mobile/common/store-map`)
   - 전체 화면 지도로 모든 매장 위치 표시
   - 사용자 현재 위치 마커 (파란색 원)
   - 매장별 마커 (영업중: 초록색, 휴업중: 회색)
   - 하단 컨트롤 버튼 (목록보기, 내 위치)

2. **매장 검색 페이지** (`/mobile/common/store-search`)
   - 기존 목록 뷰에 "지도로 보기" 토글 버튼 추가
   - 목록 보기와 지도 보기 간편 전환

### 기술 스택
- **지도 API**: 카카오맵 JavaScript API
- **위치 서비스**: HTML5 Geolocation API
- **프론트엔드**: React.js + Bootstrap
- **상태 관리**: React Hooks (useState, useEffect, useRef)

### 설정 방법

#### 1. 카카오 개발자 센터 설정
1. [카카오 개발자센터](https://developers.kakao.com) 접속
2. 애플리케이션 등록
3. JavaScript 키 발급
4. 플랫폼 설정에서 웹 도메인 등록

#### 2. HTML에 API 스크립트 추가
```html
<!-- frontend-v1/index.html -->
<script type="text/javascript" 
        src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_JAVASCRIPT_KEY&libraries=services,clusterer,drawing">
</script>
```

#### 3. 매장 데이터에 위도/경도 정보 추가
```python
# backend/stores/models.py
class Store(models.Model):
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
```

### API 엔드포인트
- **매장 목록 조회**: `GET /api/v1/stores/`
  - latitude, longitude 필드 포함
  - 유효한 위치 정보를 가진 매장만 지도에 표시

### 주요 컴포넌트

#### StoreMapPage.jsx
```javascript
// 카카오 지도 초기화
const initializeMap = async () => {
  const userLoc = await getUserLocation();
  const storeData = await fetchStores();
  
  const map = new window.kakao.maps.Map(mapContainer, mapOption);
  addStoreMarkers(map, storeData);
};

// 매장 마커 추가
const addStoreMarkers = (map, storeData) => {
  storeData.forEach((store) => {
    const markerColor = store.status === 'ACTIVE' ? '#28a745' : '#6c757d';
    // 마커 생성 및 이벤트 처리
  });
};
```

### 사용자 경험 (UX)
1. **직관적인 네비게이션**: 목록 보기 ↔ 지도 보기 간편 전환
2. **현재 위치 표시**: 사용자의 현재 위치를 파란색 마커로 표시
3. **매장 정보 접근**: 마커 클릭 시 매장 정보 즉시 확인
4. **전화 연결**: 매장 전화번호 원터치 다이얼
5. **반응형 디자인**: 모바일 화면에 최적화

### 보안 고려사항
- 카카오 JavaScript 키는 도메인 제한으로 보안 설정
- 사용자 위치 정보는 브라우저에서만 처리 (서버 전송 없음)
- HTTPS 환경에서만 위치 서비스 정상 작동

### 성능 최적화
- 지도 초기화 시 setTimeout으로 렌더링 지연 방지
- 마커 클러스터링으로 대량 매장 처리 대비
- 필요한 매장 정보만 API에서 조회 (위도/경도 필터링)

### 향후 개선 사항
- [ ] 매장별 실시간 토너먼트 정보 표시
- [ ] 길찾기 기능 (카카오내비 연동)
- [ ] 매장 사진 및 리뷰 시스템
- [ ] 즐겨찾기 매장 기능
- [ ] 매장 혼잡도 실시간 표시

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 16+
- Python 3.8+
- PostgreSQL

### 설치 및 실행
```bash
# 백엔드 설정
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 프론트엔드 설정
cd frontend-v1
npm install
npm start
```

### 환경 변수 설정
```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/asl_holdem
SECRET_KEY=your-secret-key
DEBUG=True

# 카카오 지도 설정
KAKAO_JAVASCRIPT_KEY=your-kakao-javascript-key
```

## 📁 프로젝트 구조
```
ASLHoldem_web/
├── backend/           # Django REST API
│   ├── accounts/      # 사용자 인증
│   ├── stores/        # 매장 관리
│   ├── tournaments/   # 토너먼트 관리
│   └── seats/         # SEAT권 관리
├── frontend-v1/       # React 웹 애플리케이션
│   ├── src/
│   │   ├── admin/     # 관리자 페이지
│   │   └── mobile/    # 모바일 페이지
│   │       ├── pages/common/store-search/
│   │       │   ├── StoreSearchPage.jsx    # 매장 검색 (목록)
│   │       │   ├── StoreMapPage.jsx       # 매장 지도 (신규)
│   │       │   └── StoreDetailPage.jsx    # 매장 상세
└── docs/              # API 문서
    └── API_Collection.json
```

## 🛠️ 기술 스택
- **Backend**: Django, Django REST Framework, PostgreSQL
- **Frontend**: React.js, Bootstrap, Axios
- **지도**: 카카오맵 JavaScript API
- **인증**: JWT (JSON Web Token)
- **배포**: Nginx, Gunicorn

화이팅! 🎯 