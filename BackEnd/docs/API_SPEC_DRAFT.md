# API 명세서 초안

이 문서는 현재 프로젝트의 ERD 초안을 기준으로 작성한 목표 API 명세서다.

현재 백엔드에 실제 구현된 API와, 앞으로 구현할 목표 API를 구분해서 정리한다.

## 1. 목표 API 명세서

### 유저 정보 조회

- 도메인: 유저
- 메서드: `GET`
- 경로: `/users/{user_id}`
- 설명: 유저 정보를 조회합니다.
- Path Parameter
  - `user_id`: 조회할 유저 ID
- Response Body
```json
{
  "code": "OK",
  "message": "user fetch success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "010-1234-5678",
    "birthday": "2000-01-01",
    "provider": "keycloak",
    "created_at": "2026-03-12T00:00:00Z",
    "updated_at": "2026-03-12T00:00:00Z"
  }
}
```

### 회원가입

- 도메인: 유저
- 메서드: `POST`
- 경로: `/users`
- 설명: 회원가입 합니다.
- Request Body
```json
{
  "email": "user@example.com",
  "password": "string",
  "phone": "010-1234-5678",
  "birthday": "2000-01-01"
}
```
- Response Body
```json
{
  "code": "OK",
  "message": "user signup success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "010-1234-5678",
    "birthday": "2000-01-01",
    "provider": "local",
    "created_at": "2026-03-12T00:00:00Z",
    "updated_at": "2026-03-12T00:00:00Z"
  }
}
```

### 유저 정보 수정

- 도메인: 유저
- 메서드: `PUT`
- 경로: `/users/{user_id}`
- 설명: 유저 정보를 수정합니다.
- Path Parameter
  - `user_id`: 수정할 유저 ID
- Request Body
```json
{
  "phone": "010-9999-8888",
  "birthday": "1999-12-31"
}
```
- Response Body
```json
{
  "code": "OK",
  "message": "user update success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "010-9999-8888",
    "birthday": "1999-12-31",
    "provider": "keycloak",
    "created_at": "2026-03-12T00:00:00Z",
    "updated_at": "2026-03-12T01:00:00Z"
  }
}
```

### 회원탈퇴

- 도메인: 유저
- 메서드: `DELETE`
- 경로: `/users/{user_id}`
- 설명: 회원탈퇴 합니다.
- Path Parameter
  - `user_id`: 탈퇴할 유저 ID
- Response Body
```json
{
  "code": "OK",
  "message": "user delete success",
  "data": null
}
```

### 세이브 목록 조회

- 도메인: 세이브
- 메서드: `GET`
- 경로: `/users/{user_id}/save-files`
- 설명: 유저의 세이브 파일 목록을 조회합니다.
- Path Parameter
  - `user_id`: 세이브 목록을 조회할 유저 ID
- Response Body
```json
{
  "code": "OK",
  "message": "save file list success",
  "data": [
    {
      "id": "uuid",
      "slot_no": 1,
      "version": 1,
      "current_area": "world",
      "current_place": "home",
      "time_label": "오전",
      "week": 1,
      "day_label": "월요일",
      "hp": 82,
      "hp_max": 100,
      "money": 12000,
      "stress": 20,
      "created_at": "2026-03-12T00:00:00Z",
      "updated_at": "2026-03-12T00:00:00Z"
    }
  ]
}
```

### 세이브 상세 조회

- 도메인: 세이브
- 메서드: `GET`
- 경로: `/save-files/{save_file_id}`
- 설명: 세이브 파일 상세 정보를 조회합니다.
- Path Parameter
  - `save_file_id`: 조회할 세이브 파일 ID

### 세이브 생성

- 도메인: 세이브
- 메서드: `POST`
- 경로: `/users/{user_id}/save-files`
- 설명: 새 세이브 파일을 생성합니다.
- Path Parameter
  - `user_id`: 세이브를 생성할 유저 ID
- Request Body
```json
{
  "slot_no": 1,
  "version": 1,
  "current_area": "world",
  "current_place": "home",
  "time_label": "오전",
  "week": 1,
  "day_label": "월요일",
  "hp": 82,
  "hp_max": 100,
  "money": 12000,
  "stress": 20
}
```

### 세이브 수정

- 도메인: 세이브
- 메서드: `PUT`
- 경로: `/save-files/{save_file_id}`
- 설명: 세이브 파일을 수정합니다.
- Path Parameter
  - `save_file_id`: 수정할 세이브 파일 ID

### 세이브 삭제

- 도메인: 세이브
- 메서드: `DELETE`
- 경로: `/save-files/{save_file_id}`
- 설명: 세이브 파일을 삭제합니다.
- Path Parameter
  - `save_file_id`: 삭제할 세이브 파일 ID

### 인벤토리 조회

- 도메인: 인벤토리
- 메서드: `GET`
- 경로: `/save-files/{save_file_id}/inventory`
- 설명: 세이브 파일의 인벤토리 정보를 조회합니다.
- Path Parameter
  - `save_file_id`: 조회할 세이브 파일 ID

### 인벤토리 아이템 추가

- 도메인: 인벤토리
- 메서드: `POST`
- 경로: `/save-files/{save_file_id}/inventory`
- 설명: 세이브 파일에 아이템을 추가합니다.
- Path Parameter
  - `save_file_id`: 대상 세이브 파일 ID
- Request Body
```json
{
  "item_template_id": "snack-energybar",
  "slot_index": 0,
  "quantity": 3,
  "is_equipped": false
}
```

### 인벤토리 아이템 수정

- 도메인: 인벤토리
- 메서드: `PUT`
- 경로: `/inventory-items/{inventory_item_id}`
- 설명: 인벤토리 아이템 정보를 수정합니다.
- Path Parameter
  - `inventory_item_id`: 수정할 인벤토리 아이템 ID

### 인벤토리 아이템 삭제

- 도메인: 인벤토리
- 메서드: `DELETE`
- 경로: `/inventory-items/{inventory_item_id}`
- 설명: 인벤토리 아이템을 삭제합니다.
- Path Parameter
  - `inventory_item_id`: 삭제할 인벤토리 아이템 ID

### 도전과제 목록 조회

- 도메인: 도전과제
- 메서드: `GET`
- 경로: `/challenges`
- 설명: 도전과제 정의 목록을 조회합니다.

### 유저 도전과제 조회

- 도메인: 도전과제
- 메서드: `GET`
- 경로: `/users/{user_id}/challenges`
- 설명: 유저의 도전과제 진행 상태를 조회합니다.
- Path Parameter
  - `user_id`: 조회할 유저 ID

### 유저 도전과제 할당

- 도메인: 도전과제
- 메서드: `POST`
- 경로: `/users/{user_id}/challenges`
- 설명: 유저에게 도전과제를 할당합니다.
- Path Parameter
  - `user_id`: 대상 유저 ID
- Request Body
```json
{
  "challenge_definition_id": "uuid",
  "save_file_id": "uuid"
}
```

### 유저 도전과제 진행도 수정

- 도메인: 도전과제
- 메서드: `PUT`
- 경로: `/user-challenges/{user_challenge_id}`
- 설명: 유저 도전과제 진행도를 수정합니다.
- Path Parameter
  - `user_challenge_id`: 수정할 유저 도전과제 ID
- Request Body
```json
{
  "status": "in_progress",
  "progress_value": 50
}
```

### 에셋 번들 목록 조회

- 도메인: 에셋
- 메서드: `GET`
- 경로: `/asset-bundles`
- 설명: 에셋 번들 목록을 조회합니다.

### 에셋 파일 목록 조회

- 도메인: 에셋
- 메서드: `GET`
- 경로: `/asset-bundles/{asset_bundle_id}/files`
- 설명: 특정 에셋 번들의 파일 목록을 조회합니다.
- Path Parameter
  - `asset_bundle_id`: 조회할 에셋 번들 ID

### 에셋 매니페스트 조회

- 도메인: 에셋
- 메서드: `GET`
- 경로: `/public/assets/manifest`
- 설명: 현재 활성화된 에셋 매니페스트를 조회합니다.

## 2. 현재 구현 API

### 내 유저 정보 생성 또는 동기화

- 도메인: 유저
- 메서드: `POST`
- 경로: `/api/users/me/bootstrap`
- 설명: JWT 기준으로 현재 유저를 생성하거나 동기화합니다.

### 내 유저 정보 조회

- 도메인: 유저
- 메서드: `GET`
- 경로: `/api/users/me`
- 설명: 현재 로그인한 유저 정보를 조회합니다.

### 내 계정 탈퇴

- 도메인: 유저
- 메서드: `DELETE`
- 경로: `/api/users/me`
- 설명: 현재 로그인한 유저를 소프트 삭제합니다.

### 에셋 매니페스트 조회

- 도메인: 에셋
- 메서드: `GET`
- 경로: `/api/public/assets/manifest`
- 설명: 정적 에셋 매니페스트를 조회합니다.

### 공개 핑 체크

- 도메인: 점검
- 메서드: `GET`
- 경로: `/api/public/ping`
- 설명: 공개 상태 확인용 핑 응답을 반환합니다.

### 공개 에코

- 도메인: 점검
- 메서드: `POST`
- 경로: `/api/public/echo`
- 설명: 요청 메시지를 그대로 응답합니다.

### 의존성 상태 확인

- 도메인: 점검
- 메서드: `GET`
- 경로: `/api/public/checks`
- 설명: DB와 Redis 연결 상태를 확인합니다.

### 인증 필요 핑 체크

- 도메인: 점검
- 메서드: `GET`
- 경로: `/api/private/ping`
- 설명: 인증 필요 상태 확인용 핑 응답을 반환합니다.

## 3. 정리

- 사용자 요청 형식에 맞춘 문서는 목표 API 기준으로 작성했다.
- 실제 백엔드 구현은 현재 `내 정보 기준 API` 와 `에셋 매니페스트`, `점검 API`까지만 존재한다.
- `회원가입`, `유저 정보 수정`, `세이브`, `도전과제`, `인벤토리` API는 앞으로 구현할 대상이다.
