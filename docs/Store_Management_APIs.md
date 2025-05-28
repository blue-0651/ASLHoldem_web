# 매장 관리 API 문서

## 개요
매장에서 사용자 관리 및 좌석권 관리를 위한 API 엔드포인트들입니다.

## 인증
모든 API는 JWT 토큰을 통한 인증이 필요합니다.
```
Authorization: Bearer {access_token}
```

## API 목록

### 1. 휴대폰 번호로 사용자 검색

**엔드포인트:** `GET /api/v1/store/search-user/`

**설명:** 휴대폰 번호로 기존 사용자를 검색합니다.

**파라미터:**
- `phone` (필수): 검색할 휴대폰 번호

**응답 예시:**
```json
{
  "found": true,
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "phone_number": "01012345678",
    "first_name": "홍",
    "last_name": "길동"
  }
}
```

### 2. 선수 토너먼트 등록

**엔드포인트:** `POST /api/v1/store/register-player/`

**설명:** 선수를 토너먼트에 등록하며, 자동으로 좌석권을 차감합니다.

**요청 본문:**
```json
{
  "phone_number": "01012345678",
  "tournament_id": 1,
  "username": "새사용자",
  "email": "newuser@example.com",
  "nickname": "플레이어1"
}
```

**비즈니스 로직:**
1. 사용자의 해당 토너먼트 좌석권 확인
2. 사용 가능한 좌석권이 있으면 자동 차감
3. 선수 등록 완료
4. 좌석권 거래 내역 생성

**응답 예시:**
```json
{
  "success": true,
  "message": "선수가 성공적으로 등록되었습니다. 좌석권 1개가 사용되었습니다.",
  "player": {
    "id": 1,
    "user_id": 1,
    "username": "user123",
    "phone_number": "01012345678",
    "nickname": "플레이어1",
    "registered_at": "2024-01-01T10:00:00Z"
  },
  "used_ticket": {
    "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
    "used_at": "2024-01-01T10:00:00Z",
    "tournament_name": "월요 토너먼트"
  }
}
```

### 3. 좌석권 지급

**엔드포인트:** `POST /api/v1/store/grant-ticket/`

**설명:** 사용자에게 좌석권을 지급합니다.

**요청 본문:**
```json
{
  "phone_number": "01012345678",
  "tournament_id": 1,
  "quantity": 1,
  "source": "ADMIN",
  "memo": "매장에서 지급"
}
```

**파라미터:**
- `phone_number` 또는 `user_id` (필수): 사용자 식별 정보
- `tournament_id` (필수): 토너먼트 ID
- `quantity` (선택): 지급할 좌석권 수량 (기본값: 1, 최대: 10)
- `source` (선택): 좌석권 획득 방법 (ADMIN, PURCHASE, REWARD, GIFT)
- `memo` (선택): 지급 사유 메모

**응답 예시:**
```json
{
  "success": true,
  "message": "1개의 좌석권이 성공적으로 지급되었습니다.",
  "user_phone": "01012345678",
  "tournament_name": "월요 토너먼트",
  "granted_quantity": 1,
  "tickets": [
    {
      "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "ACTIVE",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### 4. 사용자 좌석권 현황 조회

**엔드포인트:** `GET /api/v1/store/user-tickets/`

**설명:** 사용자의 좌석권 보유 현황을 조회합니다.

**파라미터:**
- `phone_number` 또는 `user_id` (필수): 사용자 식별 정보
- `tournament_id` (선택): 특정 토너먼트의 좌석권만 조회

**응답 예시 (특정 토너먼트):**
```json
{
  "user_phone": "01012345678",
  "tournament_name": "월요 토너먼트",
  "total_tickets": 3,
  "active_tickets": 2,
  "used_tickets": 1,
  "tickets": [
    {
      "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "ACTIVE",
      "status_display": "활성",
      "source": "ADMIN",
      "source_display": "관리자 지급",
      "created_at": "2024-01-01T10:00:00Z",
      "used_at": null,
      "memo": "매장에서 지급"
    }
  ]
}
```

**응답 예시 (전체 토너먼트):**
```json
{
  "user_phone": "01012345678",
  "total_tournaments": 2,
  "tournaments": [
    {
      "tournament_id": 1,
      "tournament_name": "월요 토너먼트",
      "tournament_start_time": "2024-01-01T19:00:00Z",
      "total_tickets": 3,
      "active_tickets": 2,
      "used_tickets": 1,
      "last_updated": "2024-01-01T10:00:00Z"
    }
  ]
}
```

## 에러 코드

- `400`: 잘못된 요청 데이터 또는 좌석권 부족
- `401`: 인증되지 않은 요청
- `403`: 권한이 없는 요청
- `404`: 사용자 또는 토너먼트를 찾을 수 없음
- `500`: 서버 내부 오류

## 좌석권 시스템 흐름

1. **좌석권 지급**: 매장에서 사용자에게 좌석권 지급
2. **토너먼트 등록**: 사용자가 토너먼트에 참가 시 좌석권 자동 차감
3. **거래 내역**: 모든 좌석권 증감 내역이 기록됨
4. **요약 정보**: 사용자별 토너먼트별 좌석권 현황 자동 업데이트

## 주의사항

- 토너먼트 참가 시 해당 토너먼트의 사용 가능한 좌석권이 반드시 필요합니다.
- 좌석권 차감은 트랜잭션으로 처리되어 데이터 일관성을 보장합니다.
- 중복 등록은 자동으로 방지됩니다.
- 모든 좌석권 거래는 추적 가능한 내역으로 기록됩니다. 