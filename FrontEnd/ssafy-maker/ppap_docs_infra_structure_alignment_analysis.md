# ppap docs/infra 구조 정합성 분석

## 목적
- 현재 `ppap` 프론트엔드 구현이 `docs/infra` 문서의 의도와 얼마나 맞는지 확인한다.
- 실제 코드 구조와 문서 anchor의 불일치 지점을 정리하고, 어떤 방식으로 정리할지 제안한다.

## 결론 요약
- 책임 분리 방향은 대체로 맞다.
- 하지만 `docs/infra`가 가정하는 핵심 경로와 실제 저장소 경로가 일부 다르다.
- 따라서 지금 필요한 일은 `코드를 문서에 억지로 맞추는 대규모 이동`보다 `문서 anchor를 현재 구조에 맞게 갱신`하는 것이다.

## 현재 구조와 문서의 일치 부분

### 1. feature UI / manager 조립 분리
- UI/HUD/메뉴/세이브 확인창은 `src/features`에 있다.
- 실행 제어와 씬 조립은 `src/game/managers`, `src/game/scenes`에 있다.
- 예시
  - `src/features/ui/components/GameHud.ts`
  - `src/features/save/components/saveConfirmDialog.ts`
  - `src/game/managers/InGameMenuManager.ts`
  - `src/game/scenes/MainScene.ts`

이건 문서의 `기능은 features`, `메인 흐름은 scenes`, `외부 IO는 infra`라는 의도와 맞는다.

### 2. JSON 대화 어댑터 경계
- 문서가 요구하는 `features/story/jsonDialogueAdapter.ts`는 실제로 존재한다.
- 런타임 대화 데이터도 `MainScene.runtimeDialogueScripts`로 관리한다.
- 예시
  - `src/features/story/jsonDialogueAdapter.ts`
  - `src/game/scenes/MainScene.ts`

이 부분은 문서 요구와 사실상 정합하다.

### 3. 외부 IO 경계
- 고정 이벤트 JSON 로딩은 `src/infra/story/fixedEventRepository.ts`에 있다.
- UI나 manager가 직접 fetch/storage를 하지 않고 경계를 두고 있다.

이 부분도 문서 의도와 맞는다.

## 현재 구조와 문서의 불일치 부분

### 1. scenes anchor 불일치
- 문서 기준
  - `src/scenes`
  - `src/app/registry/scenes.ts`
- 실제 코드 기준
  - `src/game/scenes`
  - `src/game/scripts/scenes/sceneRegistry.ts`

즉 문서는 `app/scenes` 축을 가정하지만, 실제 구현은 `game/scenes` 축이다.

### 2. manager/core 경계 표기 불일치
- 문서는 `src/core`를 공용 매니저/이벤트/유틸의 중심으로 설명한다.
- 실제 코드에서는 다수의 실행 제어가 `src/game/managers` 아래에 있다.
- 예시
  - `DialogueManager`
  - `ProgressionManager`
  - `PlaceActionManager`
  - `InGameMenuManager`

이건 잘못이라기보다, 문서가 현재 저장소의 `game` 축을 충분히 반영하지 못한 상태다.

### 3. registry anchor 불일치
- 문서는 `scene registry: src/app/registry/scenes.ts`를 중요 anchor로 지정한다.
- 실제는 `src/game/scripts/scenes/sceneRegistry.ts`가 registry 역할을 한다.

리뷰나 신규 작업자가 문서만 보면 잘못된 위치를 기준으로 수정할 가능성이 있다.

## 왜 지금 코드 이동보다 문서 갱신이 우선인가

### 이유 1. 현재 구조는 이미 일관성이 있다
- 씬은 `src/game/scenes`
- 매니저는 `src/game/managers`
- 기능 UI는 `src/features`
- 외부 IO는 `src/infra`

즉 저장소 내부의 실제 규칙은 이미 형성돼 있다.

### 이유 2. 지금 코드를 `src/app`, `src/scenes`로 다시 대이동하면 리스크가 크다
- import 경로 대량 변경
- scene registry 참조 수정
- lifecycle cleanup 실수 가능성 증가
- 디버그/스토리/세이브 흐름 회귀 위험

따라서 현 시점에서는 문서를 코드에 맞추는 쪽이 안전하다.

## 권장 정리안

### A안. docs/infra를 현재 구조 기준으로 갱신
가장 권장한다.

수정 방향:
- `src/scenes` -> `src/game/scenes`
- `src/app/registry/scenes.ts` -> `src/game/scripts/scenes/sceneRegistry.ts`
- `src/core` 설명은 유지하되, 현재 저장소는 실행 제어 manager가 `src/game/managers`에 있음을 명시
- `MainScene` 조립 경계를 `src/game/scenes/MainScene.ts` 기준으로 명확히 적기

장점:
- 현재 코드와 문서가 바로 맞는다.
- 신규 작업 시 잘못된 anchor 참조를 줄일 수 있다.
- 대규모 경로 이동이 필요 없다.

### B안. 장기적으로 app/scenes 구조로 수렴
중장기 리팩터링 계획으로는 가능하지만, 지금 바로 적용하는 건 비권장이다.

필요 조건:
- scene registry 재설계
- import path migration
- `game/managers`와 `core` 경계 재정의
- 여러 MR에 걸친 점진 이전 계획

장점:
- 문서와 코드가 이상적으로 일치할 수 있다.

단점:
- 지금은 비용 대비 이득이 낮다.
- 회귀 위험이 크다.

## money / gold 명칭 정리 결과

### 현재 원칙
- 내부 런타임 표준: `money`
- 외부 JSON 입력 호환: `gold`

### 적용 방식
- `DialogueStatKey`는 내부적으로 `money`를 사용한다.
- 외부 고정 이벤트 JSON의 `condition.gold`, `result.statChanges.gold`는 `jsonDialogueAdapter.ts`에서 내부 `money`로 변환한다.
- 따라서 `gold`는 외부 데이터 형식에만 남고, 내부 실행 계층은 `money`로 통일된다.

이 방식은 문서가 요구하는 `adapter 경계에서 외부 형식을 흡수`한다는 원칙과도 맞는다.

## 즉시 후속 작업 제안
1. `docs/infra/REVIEW_RULES.md`의 scene registry / scenes 경로를 현재 코드 기준으로 갱신
2. `docs/infra/STRUCTURE_MAP.md`의 directory roles를 `src/game/scenes`, `src/game/managers` 반영 형태로 수정
3. `docs/infra`에 `현재 저장소는 app/scenes 대신 game/scenes 축을 사용한다`는 migration note 추가

## 최종 판단
- 현재 구현은 `문서의 철학`에는 대체로 맞다.
- 하지만 `문서의 경로 anchor`는 오래되어 실제 구조와 어긋난다.
- 따라서 당장 해야 할 정리는:
  - 코드 대이동이 아니라
  - `docs/infra`를 현재 구조 기준으로 업데이트하는 작업이다.
