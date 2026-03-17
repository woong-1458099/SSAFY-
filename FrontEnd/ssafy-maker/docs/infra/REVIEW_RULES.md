# Frontend Review Rules

## Purpose
이 문서는 MR 리뷰 AI가 프론트엔드 코드를 검토할 때 참고할 핵심 규칙만 담는다.
설치법, 실행법, 일반 소개는 제외한다.

## Architecture Rules
- `src/app`은 앱 시작점, 설정, 전역 등록을 담당한다.
- `src/scenes`는 공통 씬 계층과 메인 흐름을 담당한다.
- `src/features`는 기능 단위 구현을 담당한다.
- `src/core`는 공용 매니저, 이벤트, 상수, 유틸을 담당한다.
- `src/infra`는 외부 API, 저장소, AI 연동 등 외부 의존성을 담당한다.

## Non-Negotiable Rules
- 씬 등록은 `src/app/registry/scenes.ts`에서만 관리한다.
- 외부 연동은 가능하면 `src/infra`를 통해 수행한다.
- 씬 종료 시 이벤트 리스너, 타이머, 비동기 후속 처리를 반드시 정리한다.
- API 응답 필드는 항상 부분 누락 가능성을 고려한다.
- 전역 상태 사용은 기존 패턴을 따르며 임의 확장을 피한다.

## Common Failure Modes
- 씬 재진입 시 listener가 중복 등록된다.
- `shutdown` 또는 `destroy` 시 cleanup이 빠진다.
- API 응답 필드를 단정하고 직접 접근한다.
- 비동기 응답 시점 차이로 stale state가 발생한다.
- registry 규칙을 우회해 씬을 직접 연결한다.
- `src/infra`를 우회해 UI 또는 씬에서 직접 외부 호출을 추가한다.

## Review Checklist
- 씬 lifecycle에 맞는 cleanup이 있는가
- 이벤트 리스너 중복 등록 가능성이 있는가
- 타이머, interval, delayedCall 정리가 되는가
- API 실패, null, 필드 누락 처리가 있는가
- 기존 registry 또는 구조 규칙을 깨지 않는가
- 기능이 `features`, `core`, `infra` 책임을 침범하지 않는가

## Escalate To Large Model When
- 씬 등록 구조가 바뀐다
- 전역 이벤트 흐름이 바뀐다
- 인증, 저장, 외부 AI 연동이 수정된다
- 여러 계층 파일이 동시에 수정된다
