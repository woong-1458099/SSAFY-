# Backend Review Rules

## Purpose
이 문서는 MR 리뷰 AI가 백엔드 코드를 검토할 때 참고할 핵심 규칙만 담는다.
설치법, 실행법, 일반 소개는 제외한다.

## Layer Rules
- Controller는 요청/응답 처리와 인증 정보 수집의 진입점을 담당한다.
- Service는 비즈니스 로직과 트랜잭션 경계를 담당한다.
- Repository는 영속성 접근을 담당한다.
- DTO는 외부 입출력 계약을 표현한다.
- Config와 Security는 전역 동작을 바꾸므로 영향 범위를 크게 본다.

## Non-Negotiable Rules
- Controller에 비즈니스 로직을 과도하게 넣지 않는다.
- 클라이언트가 보낸 권한, 상태, 식별자, 헤더를 무조건 신뢰하지 않는다.
- 요청 검증과 null 처리를 명확히 한다.
- 예외를 삼키지 말고 정책에 맞게 노출한다.
- 전역 설정 변경은 직렬화, 보안, 필터 체인 영향까지 검토한다.
- 인증과 인가 로직은 기존 보안 경계를 우회하지 않는다.

## Common Failure Modes
- Controller가 Service 책임을 침범한다.
- 요청값 검증이 빠져 런타임 예외가 발생한다.
- Optional 또는 null 처리 누락으로 NPE가 발생한다.
- Security 또는 Config 수정이 전역 동작을 깨뜨린다.
- Jackson/ObjectMapper 수정이 기존 응답 형식을 바꾼다.
- 예외 처리가 일관되지 않아 API 계약이 흔들린다.

## Review Checklist
- 입력 검증이 충분한가
- null, optional, empty 처리 경로가 있는가
- 권한 검증 또는 신뢰 경계가 깨지지 않는가
- 전역 config 변경 영향 범위를 점검했는가
- service와 controller 책임이 섞이지 않았는가
- repository 호출 방식이 비효율 또는 N+1 위험을 만들지 않는가

## Escalate To Large Model When
- `config`, `security`, `auth`, `jwt`, `keycloak`, `jackson` 관련 파일이 바뀐다
- controller, service, dto가 함께 바뀐다
- 직렬화 또는 역직렬화 정책이 바뀐다
- 인증, 인가, 예외 처리 정책이 바뀐다