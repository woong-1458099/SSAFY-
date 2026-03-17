# SSAFYMaker Backend

Spring Boot 기반 백엔드 서버입니다.

## 실행 방법

1. 의존성 설치 및 빌드
```bash
./gradlew build
```
2. 개발 서버 실행
```bash
./gradlew bootRun
```

## 핵심 구조

- `src/main/java/.../controller`: 요청 진입점과 응답 반환
- `src/main/java/.../service`: 비즈니스 로직과 트랜잭션 경계
- `src/main/java/.../repository`: DB 접근
- `src/main/java/.../dto`: 요청/응답 계약
- `src/main/java/.../entity`: 영속 모델
- `src/main/java/.../config`, `src/main/java/.../security`: 전역 설정과 보안 경계

## 문서

- API 초안: `docs/API_SPEC_DRAFT.md`
- ERD: `docs/POSTGRESQL_ERD.md`
- MR 리뷰 규칙: `docs/infra/REVIEW_RULES.md`
- MR 리뷰 구조 맵: `docs/infra/STRUCTURE_MAP.md`

## MR 리뷰 문서 동기화 규칙

- `controller`, `service`, `repository`, `dto`, `entity`, `config`, `security` 책임이나 연결 방식이 바뀌면 `docs/infra/STRUCTURE_MAP.md`도 같이 갱신합니다.
- MR 리뷰 AI가 참고하는 검증 규칙, 보안 경계, 예외 처리 기준이 바뀌면 `docs/infra/REVIEW_RULES.md`도 같이 갱신합니다.
- 직렬화 정책, 인증/인가 흐름, 전역 설정 영향 범위가 바뀌면 코드 변경만 올리지 말고 문서 변경도 같은 MR에 포함합니다.
- PR/MR 작성 전에 현재 변경이 `docs/infra/REVIEW_RULES.md`, `docs/infra/STRUCTURE_MAP.md`와 어긋나는지 먼저 확인합니다.
