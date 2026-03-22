# Frontend Review Rules

## Purpose
이 문서는 MR 리뷰 AI가 프론트엔드 코드를 검토할 때 참고할 핵심 규칙만 담는다.
설치법, 실행법, 일반 소개는 제외한다.

## Architecture Rules
- `src/app`은 앱 시작점, 설정, 전역 등록을 담당한다.
- `src/common`은 공통 enum, 타입, 다계층 계약을 담당한다.
- `src/debug`는 디버그 입력, 오버레이, 디버그 전용 서비스를 담당한다.
- `src/game`은 씬, 매니저, 정의, 상태, 런타임 조립을 담당한다.
- `src/game/scenes`는 공통 씬 계층과 메인 흐름을 담당한다.
- `src/game/scenes/legacyMinigames`는 개별 미니게임들의 독립된 로직을 담는다.
- `src/features`는 기능 단위 구현을 담당한다.
- `src/infra`는 외부 API, 저장소, AI 연동 등 외부 의존성을 담당한다.

## Non-Negotiable Rules
- Phaser 씬 클래스 등록은 `src/app/registry/sceneRegistry.ts`에서 관리한다.
- 시작 씬/scene script 해석은 `src/game/scripts/scenes/`에서 관리한다.
- 미니게임 추가 시 `src/app/registry/sceneRegistry.ts`, `src/features/minigame/minigameCatalog.ts`, `src/features/minigame/minigameSceneKeys.ts`, `src/game/scenes/legacyMinigames` 연결 지점을 반드시 함께 확인한다.
- NPC 대화 스크립트 로딩은 `src/features/story/jsonDialogueAdapter.ts`를 통해 수행하며, 동적 대화 데이터는 `MainScene`의 `runtimeDialogueScripts`에서 관리한다.
- 외부 연동은 가능하면 `src/infra`를 통해 수행한다.
- 씬 종료 시 이벤트 리스너, 타이머, 비동기 후속 처리를 반드시 정리한다.
- API 응답 필드는 항상 부분 누락 가능성을 고려한다.
- 전역 상태 사용은 기존 패턴을 따르며 임의 확장을 피한다.
- `src/debug`는 상태를 직접 변경하지 않고 `MainScene`/manager를 통한 명령 전달만 수행한다.

## Common Failure Modes
- 씬 재진입 시 listener가 중복 등록된다. (특히 키보드 입력 및 타이머)
- `shutdown` 또는 `destroy` 시 cleanup이 빠진다.
- 미니게임 추가 시 카탈로그, 씬 키, Phaser scene registry 중 하나가 누락되어 런타임 에러가 발생한다.
- API 응답 필드를 단정하고 직접 접근한다.
- 비동기 응답 시점 차이로 stale state가 발생한다.
- registry 규칙을 우회해 씬을 직접 연결한다.
- `src/infra`를 우회해 UI 또는 씬에서 직접 외부 호출을 추가한다.
- 런타임 대화 ID나 디버그 입력이 검증 없이 전역 상태 경계로 들어간다.

## Review Checklist
- 씬 lifecycle에 맞는 cleanup이 있는가
- 이벤트 리스너 중복 등록 가능성이 있는가
- 타이머, interval, delayedCall 정리가 되는가
- 신규 미니게임의 경우 `sceneRegistry.ts`, `minigameCatalog.ts`, `minigameSceneKeys.ts`, 씬 연결 지점이 함께 갱신되었는가?
- JSON 기반 대화 데이터가 어댑터를 통해 올바르게 주입되고, 런타임 ID 검증이 있는가?
- API 실패, null, 필드 누락 처리가 있는가
- 기존 registry 또는 구조 규칙을 깨지 않는가
- 기능이 `game`, `features`, `common`, `infra`, `debug` 책임을 침범하지 않는가

## Escalate To Large Model When
- 씬 등록 구조가 바뀐다
- 전역 이벤트 흐름이 바뀐다
- 인증, 저장, 외부 AI 연동이 수정된다
- 여러 계층 파일(app, game, features, infra, debug)이 동시에 수정된다
