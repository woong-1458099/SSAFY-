# Backend Structure Map

## Directory Roles
- `src/main/java/.../controller`: 요청 진입점, 응답 반환
- `src/main/java/.../service`: 비즈니스 로직, 트랜잭션
- `src/main/java/.../repository`: DB 접근
- `src/main/java/.../dto`: API 요청과 응답 계약
- `src/main/java/.../entity`: 영속 모델
- `src/main/java/.../config`, `.../security`: 전역 설정과 보안 경계

## Important Anchors
- Security configuration files
- Jackson/ObjectMapper configuration files
- 공통 예외 처리 진입점
- 인증, 인가 관련 service 또는 filter
- 주요 controller-service 연결 지점

## Expected Dependency Direction
- controller -> service -> repository
- dto는 controller와 service 경계에서 사용한다
- config와 security는 명확한 전역 역할만 가진다
- entity를 외부 API 계약으로 직접 과다 노출하지 않는다

## Review Hints
- controller 변경이면 validation과 service 책임 분리를 먼저 본다
- service 변경이면 트랜잭션, 예외, null 안전성을 먼저 본다
- config 또는 security 변경이면 전역 영향과 하위 호환을 먼저 본다
