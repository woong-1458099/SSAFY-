# Frontend Structure Map

## Directory Roles
- `src/app`: 앱 부트스트랩, 설정, 전역 registry
- `src/common`: 공통 enum, 타입, 다계층 공유 계약
- `src/debug`: 디버그 입력, 오버레이, 디버그 전용 서비스
- `src/game`: 씬, 매니저, 정의, 상태, 런타임 조립
- `src/game/scenes`: 공통 씬 계층과 메인 흐름
- `src/game/scenes/legacyMinigames`: 레거시 및 개별 미니게임 로직
- `src/features`: 기능 단위 구현 (Minigame, Story, Inventory 등)
- `src/features/story`: authored/fixed-event story 어댑터 로직
- `src/infra`: API, 저장, 외부 서비스 연동
- `public/assets/game/data/story`: authored dialogue, scene state, fixed event JSON 자산

## Important Anchors
- Phaser scene registry: `src/app/registry/sceneRegistry.ts`
- Scene script registry / start scene resolution: `src/game/scripts/scenes/sceneRegistry.ts`
- Minigame Catalog: `src/features/minigame/minigameCatalog.ts`
- JSON Dialogue Adapter: `src/features/story/jsonDialogueAdapter.ts`
- Authored Story Loader: `src/infra/story/authoredStoryRepository.ts`
- App bootstrap: `src/app`
- Shared scene layer: `src/game/scenes`
- Main orchestration scene: `src/game/scenes/MainScene.ts` (World Logic) & `src/game/scenes/InGameUIScene.ts` (UI Layer)
- Runtime state: `src/game/state`
- External integration boundary: `src/infra`

## Expected Dependency Direction
- `app` -> `game`, `features`, `common`, `infra`, `debug`
- `game` -> `features`, `common`, `infra`, `debug`
- `features` -> `common`, `infra`
- `common`은 가능한 한 재사용 가능하고 의존성이 가벼워야 한다
- `debug`는 상태를 직접 소유하지 않고 명령 발행/가시화에 집중한다
- `infra`는 외부 IO와 연동을 담당한다

## Review Hints
- 미니게임 추가 시: `app/registry/sceneRegistry.ts`, `features/minigame`, `game/scenes/legacyMinigames` 세 곳의 정합성을 확인한다.
- NPC 대화 변경 시: `features/story` 어댑터, `StoryEventManager`, `MainScene`의 호출 로직을 확인한다.
- 씬 관련 변경이면 registry와 lifecycle 정합성을 먼저 본다
- API 관련 변경이면 `infra` 경유 여부와 실패 처리를 먼저 본다
- 전역 이벤트 및 디버그 입력 변경이면 중복 구독과 cleanup 누락을 먼저 본다
