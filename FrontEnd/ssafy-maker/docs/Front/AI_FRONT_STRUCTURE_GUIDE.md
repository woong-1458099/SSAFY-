# AI Front 구조 가이드

이 문서는 이 프로젝트 구조를 빠르게 파악하려는 AI용 인덱스다. 먼저 이 파일을 읽고, 작업 종류에 따라 아래 세부 문서를 열어라.

## 핵심 구조 요약

- 실제 게임 조립 중심은 `src/game/scenes/MainScene.ts`다.
- 데이터 정의는 `definitions`, 실행 순서는 `scripts`, 실제 동작은 `managers`가 담당한다.
- `scene state`는 "맵이 열리자마자 깔리는 기본 상태"다.
- `scene script`는 "순차 실행되는 연출"이다.
- `InteractionManager`는 플레이어가 NPC, 지역 전이, 장소와 상호작용하는 진입점이다.
- `DialogueManager`는 등록된 대화 스크립트를 재생한다.
- `WorldManager`는 area/TMX/레이어/그리드 해석을 맡는다.

## 가장 먼저 읽을 파일

1. `src/game/scenes/MainScene.ts`
2. `src/game/managers/InteractionManager.ts`
3. `src/game/managers/NpcManager.ts`
4. `src/game/directors/SceneDirector.ts`
5. `src/game/systems/sceneStateRuntime.ts`

## 문서 선택 가이드

작업 종류별로 아래 문서를 먼저 열어라.

- 디버그 키, 오버레이, 순간이동을 알고 싶다: `docs/Front/DEBUG_GUIDE.md`
- NPC를 추가하거나 위치를 바꾸고 싶다: `docs/Front/NPC_GUIDE.md`
- 컷신, 액션 배열, 시작 씬을 수정하고 싶다: `docs/Front/SCENE_GUIDE.md`
- 맵, TMX, 지역 전환, 출발 타일을 수정하고 싶다: `docs/Front/AREA_MAP_GUIDE.md`
- 대사, dialogueId, 스토리 흐름을 수정하고 싶다: `docs/Front/DIALOGUE_STORY_GUIDE.md`
- AI에게 작업을 직접 시킬 프롬프트가 필요하다: `docs/Front/AI_STORY_NPC_WORK_PROMPT.md`

## 구조를 보는 기준

이 프로젝트는 아래처럼 보면 된다.

- `src/app`
  - Phaser 앱 시작점과 전역 등록
- `src/common`
  - enum, 공통 타입, 에셋 키
- `src/game/definitions`
  - area, place, NPC, scene state 같은 정적 정의
- `src/game/scripts`
  - dialogue, scene script 같은 작성 데이터
- `src/game/managers`
  - 플레이어, NPC, 월드, 상호작용, 대화의 런타임 제어
- `src/game/directors`
  - 순차 액션 실행기
- `src/game/systems`
  - scene state 주입, TMX 해석, 애니메이션 같은 보조 시스템
- `src/debug`
  - 오버레이, 디버그 키, 이벤트 로그

## 작업 시 판단 기준

- "맵에 가만히 서 있는 NPC"를 건드리는가: `scene state`
- "씬 시작 후 순서대로 움직이는 연출"을 건드리는가: `scene script`
- "플레이어가 스페이스로 대화하는 내용"을 건드리는가: `dialogue`
- "어느 지역으로 들어가고 어디서 시작하는가"를 건드리는가: `area / transition`
- "새 ID를 추가하는가"를 건드리는가: enum + definition + registry를 함께 확인

## 현재 코드에서 특히 중요한 사실

- `NpcDebugPanel.ts`, `SceneDebugPanel.ts`, `actionRunner.ts`는 현재 비어 있다. 실제 디버그와 씬 실행은 다른 파일을 봐야 한다.
- 현재 scene action 타입은 제한적이다. 새 액션을 만들지 않는 한 지원되는 연출은 `spawnNpc`, `moveNpc`, `turnNpc`, `playDialogue`, `wait` 뿐이다.
- 현재 대화 가능한 NPC는 scene state에 들어 있는 NPC 기준으로 잡힌다.
- 새 NPC를 추가할 때는 ID, 정의, 에셋 정합성이 먼저 맞아야 한다.
