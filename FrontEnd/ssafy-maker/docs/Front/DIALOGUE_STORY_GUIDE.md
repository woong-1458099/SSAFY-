# Dialogue/Story Guide

## 핵심 파일

- `src/common/enums/dialogue.ts`
- `src/game/scripts/dialogues/*.ts`
- `src/game/scripts/dialogues/dialogueRegistry.ts`
- `src/game/managers/DialogueManager.ts`
- `src/game/managers/InteractionManager.ts`

## 책임 분리

- `dialogue.ts`: dialogue ID 목록
- `dialogues/*.ts`: 실제 대사 스크립트
- `dialogueRegistry.ts`: 런타임 등록
- `DialogueManager.ts`: UI 표시와 노드 진행
- `InteractionManager.ts`: 어떤 NPC 또는 장소가 어떤 dialogueId 를 재생할지 연결

## 어떤 작업에서 이 문서를 보나

- 새 대화를 만들고 싶을 때
- 기존 NPC의 대사를 바꾸고 싶을 때
- 장소 상호작용 문구를 바꾸고 싶을 때
- 컷신 중 `playDialogue` 대상 대화를 추가하고 싶을 때

## 실무 규칙

- 새 대화를 만들면 enum과 registry를 같이 본다.
- scene state 의 NPC 대화와 scene script 의 `playDialogue`는 둘 다 같은 dialogue registry를 쓴다.
- 현재 선택지가 있어도 `DialogueManager`는 첫 choice만 따라간다. 복잡한 분기형 스토리는 이 제약을 먼저 해결하지 않으면 기대대로 동작하지 않는다.
