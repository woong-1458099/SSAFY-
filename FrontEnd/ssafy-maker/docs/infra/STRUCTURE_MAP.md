# Frontend Structure Map

## Directory Roles
- `src/app`: 앱 부트스트랩, 설정, 전역 registry
- `src/scenes`: 공통 씬 계층과 메인 흐름
- `src/features`: 기능 단위 구현
- `src/core`: 공통 이벤트, 매니저, 상수, 유틸
- `src/infra`: API, 저장, 외부 서비스 연동

## Important Anchors
- Scene registry: `src/app/registry/scenes.ts`
- App bootstrap: `src/app`
- Shared scene layer: `src/scenes`
- External integration boundary: `src/infra`

## Expected Dependency Direction
- `app` -> `scenes`, `features`, `core`, `infra`
- `scenes` -> `features`, `core`, `infra`
- `features` -> `core`, `infra`
- `core`는 가능한 한 재사용 가능하고 의존성이 가벼워야 한다
- `infra`는 외부 IO와 연동을 담당한다

## Review Hints
- 씬 관련 변경이면 registry와 lifecycle 정합성을 먼저 본다
- API 관련 변경이면 `infra` 경유 여부와 실패 처리를 먼저 본다
- 전역 이벤트 관련 변경이면 중복 구독과 cleanup 누락을 먼저 본다
