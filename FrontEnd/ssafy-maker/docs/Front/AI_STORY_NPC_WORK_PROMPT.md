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
  - 배치 원본: `public/assets/game/data/story/authored/scene_states.json`
  - 컷신 액션: `src/game/scripts/scenes/*`
  - 대화 원본: `public/assets/game/data/story/authored/dialogues.json`
  - authored JSON 로드: `src/infra/story/authoredStoryRepository.ts`
  - 실제 대화 등록 버퍼: `src/game/scripts/dialogues/dialogueRegistry.ts`
- 상호작용 진입점은 `InteractionManager`다.
  - NPC 대화
  - area transition
  - static place 대화
- 집 행동, 카페/편의점/헬스장 같은 장소 수치와 문구는 `src/game/definitions/places/placeActionDefinitions.ts`에서 관리한다.

## 디버그 툴 사용법

디버그 입력은 `src/debug/services/DebugInputController.ts`, 오버레이 표시는 `src/debug/overlay/DebugOverlay.ts`에 연결되어 있다.

- `F1`: 디버그 오버레이 표시/숨김
- `F2`: 월드 그리드 표시/숨김
- `F3`: 디버그 패널 표시/숨김
- `T`: 현재 마우스 월드 위치로 플레이어 순간이동
- `M`: 미니게임 디버그 HUD 토글
- `1` 또는 `NumPad 1`: 시작 씬을 `scene_world_default`로 바꾸고 재시작
- `2` 또는 `NumPad 2`: 시작 씬을 `scene_downtown_default`로 바꾸고 재시작
- `3` 또는 `NumPad 3`: 시작 씬을 `scene_campus_default`로 바꾸고 재시작

`F3` 패널은 3페이지 구조입니다.

- `기본 디버그`: HP, 돈, 행동력, 주차 같은 런타임 수치 조정
- `스토리 디버그`: 주차별 고정 이벤트 및 로맨스 이벤트 탐색, 설명/요구 스탯 확인, 조건 점프, 즉시 실행, 완료 기록 초기화
- `엔딩 디버그`: 현재까지 쌓인 스탯을 기반으로 도출되는 엔딩 정보 확인

---

### 고정 이벤트/로맨스 JSON 구조 (Choice Actions)

고정 이벤트(`fixed_week*.json`)나 로맨스 데이터(`romance_*.json`) 내의 선택지(`choices`)는 이제 단순 텍스트 이상의 행동을 할 수 있습니다.

**주요 필드:**
- `action`: 선택 시 실행되는 특수 동작 (`playInterview`, `playQuiz`, `openShop` 등)
- `statChanges`: 선택 시 변하는 스탯
- `affectionChanges`: 선택 시 변하는 NPC 호감도

예시:
```json
{
  "text": "\"열심히 하겠습니다!\"",
  "action": "playInterview",
  "result": {
    "statChanges": { "stress": 10 }
  }
}
```


## 현재 NPC에 먹일 수 있는 액션 종류

`src/common/types/sceneAction.ts` 기준 현재 지원 액션은 아래 5개뿐이다.

### 1. `spawnNpc`, 2. `moveNpc`, 3. `turnNpc`, 4. `playDialogue`, 5. `wait`
(세부 필드는 `src/common/types/sceneAction.ts` 참조)

## 중요한 제약

- **NpcId 정의**: `src/common/enums/npc.ts`와 `npcDefinitions.ts`에 정의된 ID만 사용 가능.
- **씬 상태**: 맵에서 상호작용 가능한 NPC는 `SceneState.npcs`에 등록되어야 함.
- **컷신**: `moveNpc` 등은 해당 NPC가 먼저 `spawn`된 상태여야 함.
- **선택지**: `DialogueManager`는 이제 다중 선택지와 `action` 필드를 통한 특수 동작 실행을 지원함.

## 작업 위치 빠른 안내

작업 목표별 수정 위치:

- 캠퍼스/번화가/월드에 기본 NPC 배치 추가: `public/assets/game/data/story/authored/scene_states.json`
- 새 컷신 스크립트 추가: `src/game/scripts/scenes/*`
- 컷신 등록: `src/game/scripts/scenes/sceneRegistry.ts`
- 새 대화 스크립트 추가: `public/assets/game/data/story/authored/dialogues.json`
- authored JSON 로드 경로: `src/infra/story/authoredStoryRepository.ts`
- 지역 전환 위치 수정: `src/game/definitions/places/areaTransitionDefinitions.ts`
- 집/카페/장소 행동 수치 수정: `src/game/definitions/places/placeActionDefinitions.ts`
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
