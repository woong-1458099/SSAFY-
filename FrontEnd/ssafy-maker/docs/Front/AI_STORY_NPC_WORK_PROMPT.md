# AI Story/NPC 작업 프롬프트

이 문서는 스토리 추가, NPC 배치, 간단한 컷신 연출을 수정할 AI에게 바로 먹이는 작업용 문서다.

범위:

- 이 문서는 전체 프로젝트 구조 설명서가 아니다.
- 목적은 스토리, NPC, 대화, 컷신, 지역 이동 관련 작업을 빠르게 처리하게 하는 것이다.
- 저장, 인증, 인벤토리, 진행, 미니게임 전체 구조는 `docs/Front/AI_FRONT_STRUCTURE_GUIDE.md`를 먼저 확인한 뒤 들어가라.

## 먼저 알아야 할 것

- 이 프로젝트의 메인 런타임 씬은 `src/game/scenes/MainScene.ts`다.
- "맵에 서 있는 NPC"는 주로 `scene state`에서 초기 배치된다.
- "컷신처럼 순차 실행되는 연출"은 `scene script`의 액션 배열에서 실행된다.
- NPC와 대화는 분리되어 있다.
  - 배치: `src/game/definitions/sceneStates/*`
  - 컷신 액션: `src/game/scripts/scenes/*`
  - 대화 내용: `src/game/scripts/dialogues/*`
  - 실제 대화 등록: `src/game/scripts/dialogues/dialogueRegistry.ts`
- 상호작용 진입점은 `InteractionManager`다.
  - NPC 대화
  - area transition
  - static place 대화

## 디버그 툴 사용법

디버그 입력은 `src/debug/services/DebugInputController.ts`, 오버레이 표시는 `src/debug/overlay/DebugOverlay.ts`에 연결되어 있다.

- `F1`: 디버그 오버레이 표시/숨김
- `F2`: 월드 그리드 표시/숨김
- `F3`: 디버그 패널 표시/숨김
- `T`: 현재 마우스 월드 위치로 플레이어 순간이동
- `M`: 미니게임 디버그 HUD 토글
- `1`: 시작 씬을 `scene_world_default`로 바꾸고 재시작
- `2`: 시작 씬을 `scene_downtown_default`로 바꾸고 재시작
- `3`: 시작 씬을 `scene_campus_default`로 바꾸고 재시작

오버레이에서 바로 확인 가능한 정보:

- 현재 area
- 현재 TMX 키
- 맵 크기
- collision / interaction / foreground 레이어 수
- blocked / interaction 그리드 셀 수
- 플레이어 좌표와 타일 좌표
- 상호작용 대상 NPC
- 현재 실행 중인 scene script 와 action index
- 현재 씬의 NPC 좌표 목록

주의:

- 디버그는 `src/debug/config/debugFlags.ts`의 `overlayEnabled`, `worldGridEnabled`가 `true`여야 보인다.
- NPC 배치 좌표는 현재 코드상 픽셀 단위다. 타일 단위로 착각하지 말 것.

## 현재 NPC에 먹일 수 있는 액션 종류

`src/common/types/sceneAction.ts` 기준 현재 지원 액션은 아래 5개뿐이다.

### 1. `spawnNpc`

새 NPC를 씬에 생성한다.

필드:

- `npcId`
- `x`
- `y`
- `facing?`

예시:

```ts
const action = { type: "spawnNpc", npcId: "minsu", x: 220, y: 430, facing: "down" };
```

### 2. `moveNpc`

이미 생성된 NPC를 지정 좌표로 이동시킨다.

필드:

- `npcId`
- `toX`
- `toY`
- `duration`

예시:

```ts
const action = { type: "moveNpc", npcId: "minsu", toX: 320, toY: 430, duration: 1000 };
```

### 3. `turnNpc`

NPC가 바라보는 방향만 바꾼다.

필드:

- `npcId`
- `facing`

예시:

```ts
const action = { type: "turnNpc", npcId: "minsu", facing: "left" };
```

### 4. `playDialogue`

등록된 대화 스크립트를 재생한다.

필드:

- `dialogueId`

예시:

```ts
const action = { type: "playDialogue", dialogueId: "minsu_intro" };
```

### 5. `wait`

다음 액션으로 넘어가기 전 대기한다.

필드:

- `duration`

예시:

```ts
const action = { type: "wait", duration: 500 };
```

## 중요한 제약

- 현재 `NpcId`는 `minsu`, `hyewon`, `hyunseok`만 정의되어 있다.
- 새로운 NPC를 추가하려면 최소한 아래를 같이 수정해야 한다.
  - `src/common/enums/npc.ts`
  - `src/game/definitions/npcs/npcDefinitions.ts`
  - 필요 시 NPC 에셋 카탈로그와 실제 이미지
- 맵에서 대화 가능한 NPC는 `SceneState.npcs`에 있어야 한다.
- 컷신 액션에서 `moveNpc`를 쓰려면 그 NPC가 먼저 spawn 되어 있어야 한다.
- `dialogueId`는 `src/common/enums/dialogue.ts`와 `src/game/scripts/dialogues/dialogueRegistry.ts`에 맞아야 한다.
- authored 대화는 `src/common/enums/dialogue.ts`와 `src/game/scripts/dialogues/dialogueRegistry.ts`를 따른다. 단, 고정 이벤트 JSON은 `src/features/story/jsonDialogueAdapter.ts`와 `StoryEventManager`를 통해 런타임 대화 ID로 주입된다.
- 현재 `DialogueManager`는 방향키/W/S, 숫자키, Enter/Space로 선택지를 고를 수 있다. 숫자키 `1/2/3/4`는 대화 중 디버그 씬 전환보다 선택 입력이 우선되도록 막혀 있다.

## 작업 위치 빠른 안내

작업 목표별 수정 위치:

- 캠퍼스/번화가/월드에 기본 NPC 배치 추가: `src/game/definitions/sceneStates/*`
- 새 컷신 스크립트 추가: `src/game/scripts/scenes/*`
- 컷신 등록: `src/game/scripts/scenes/sceneRegistry.ts`
- 새 대화 스크립트 추가: `src/game/scripts/dialogues/*`
- 대화 등록: `src/game/scripts/dialogues/dialogueRegistry.ts`
- 지역 전환 위치 수정: `src/game/definitions/places/areaTransitionDefinitions.ts`
- 지역 TMX/레이어 계약 수정: `src/game/definitions/areas/areaDefinitions.ts`

## AI에게 바로 먹일 프롬프트 템플릿

아래 템플릿을 그대로 써도 된다.

```md
너는 이 프로젝트의 FrontEnd/ssafy-maker를 수정하는 AI 개발자다.

목표:
- [무엇을 추가/수정할지 한 줄로 설명]

작업 종류:
- [ ] 맵 기본 NPC 배치 추가
- [ ] 기존 NPC 위치/대사 수정
- [ ] 새 대화 스크립트 추가
- [ ] 새 컷신 scene script 추가
- [ ] 기존 scene script 수정
- [ ] 새 NPC 정의 추가

작업 상세:
- area: [world | downtown | campus]
- sceneStateId 또는 sceneId: [예: campus_default, scene_001]
- npcId: [예: minsu]
- dialogueId: [예: minsu_intro]
- 좌표: [예: x=220, y=430]
- 방향: [up/down/left/right]
- 연출 순서: [필요하면 액션 배열 순서로 작성]
- 기대 결과: [플레이 중 어떤 모습이 보여야 하는지]

수정 규칙:
- 기존 구조를 유지하고 새 구조를 임의로 만들지 마라.
- 등록이 필요한 항목은 registry 파일까지 같이 수정해라.
- 존재하지 않는 npcId, dialogueId, sceneId를 쓰지 마라. 필요하면 정의와 등록을 함께 추가해라.
- 배치형 NPC와 컷신 액션형 NPC의 경로를 혼동하지 마라.
- 수정 후 어떤 파일을 왜 바꿨는지 짧게 요약해라.
```

## AI에게 더 잘 시키는 방법

- "캠퍼스에 NPC 한 명 추가"처럼 모호하게 말하지 말고 area, npcId, 대사, 좌표, 기대 연출을 같이 준다.
- "스토리 추가"라고만 하지 말고 상호작용형인지 컷신형인지 먼저 정한다.
- 좌표를 모르면 먼저 디버그 오버레이와 순간이동으로 후보 위치를 잡고 나서 수정한다.
