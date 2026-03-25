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
- **분기 및 액션 체계**: `DialogueManager`는 이제 다중 선택지(choices)와 조건부 렌더링을 완벽히 지원합니다. 선택지 결과로 스탯 변화(`statChanges`), 호감도 변화(`affectionChanges`), 플래그 설정(`setFlags`), 그리고 특수한 동작(`action`)을 실행할 수 있습니다.
- **로맨스 이벤트**: 고정 이벤트 외에 캐릭터별 로맨스 이벤트 데이터(`romance_*.json`)가 존재하며, 성별에 따라 필터링되어 재생됩니다.
