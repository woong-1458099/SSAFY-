# Scene Guide

## 핵심 파일

- `src/common/types/sceneAction.ts`
- `src/common/types/sceneScript.ts`
- `src/game/scripts/scenes/sceneIds.ts`
- `src/game/scripts/scenes/sceneRegistry.ts`
- `src/game/directors/SceneDirector.ts`
- `src/game/systems/sceneStateRuntime.ts`

## scene state 와 scene script 차이

- `scene state`: 맵이 시작될 때 먼저 깔리는 초기 NPC 상태
- `scene script`: 그 뒤에 순차적으로 실행되는 연출 액션

런타임에서는 `buildRuntimeSceneScript()`가 scene state의 NPC들을 `spawnNpc` 액션으로 앞에 붙인 뒤 `SceneDirector`가 순서대로 실행한다.

## 현재 지원 액션

- `spawnNpc`
- `moveNpc`
- `turnNpc`
- `playDialogue`
- `wait`

## 어떤 작업에서 이 문서를 보나

- 씬 시작 시 컷신을 넣고 싶을 때
- 기본 시작 씬을 바꾸고 싶을 때
- 특정 area 진입 시 다른 연출을 재생하고 싶을 때
- 새 sceneId 를 추가하고 등록하고 싶을 때

## 실무 규칙

- 새 scene script를 만들면 `sceneRegistry.ts`에 반드시 등록한다.
- scene script 안의 `area`와 `initialStateId` 조합이 실제 area와 맞는지 확인한다.
- `moveNpc`는 없는 NPC를 움직이면 런타임 에러가 난다.
