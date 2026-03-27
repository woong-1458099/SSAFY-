# NPC Guide

## 핵심 파일

- `src/common/enums/npc.ts`
- `src/game/definitions/npcs/npcDefinitions.ts`
- `src/game/definitions/sceneStates/*.ts`
- `src/game/managers/NpcManager.ts`
- `src/game/managers/InteractionManager.ts`

## 책임 분리

- `npc.ts`: 사용할 수 있는 NPC ID 목록
- `npcDefinitions.ts`: 이름, 기본 방향, 이동 속도, 비주얼 에셋 연결
- `sceneStates/*.ts`: 각 지역 기본 배치와 상호작용용 `dialogueId`
- `NpcManager.ts`: 생성, 이동, 회전, 스냅샷
- `InteractionManager.ts`: 플레이어가 가까이 가서 대화할 수 있는지 판정

## 어떤 작업에서 이 문서를 보나

- 기존 NPC 위치를 바꾸고 싶을 때
- 새 NPC를 추가하고 싶을 때
- 캠퍼스/번화가/월드에 기본 배치를 넣고 싶을 때
- NPC와 상호작용 거리를 조정하고 싶을 때

## 실무 규칙

- 기본 배치 NPC는 `scene state`에 넣는다.
- 대화 가능 여부는 `scene state`의 `dialogueId` 기준이다.
- `moveNpc`를 쓰는 컷신에서는 먼저 spawn 여부를 보장해야 한다.
- 새 NPC를 추가하면 enum, definition, asset 연결을 한 세트로 본다.
