# Minigame Porting

## 목적

`shard`에서 동작하던 미니게임 전체를 `ppap` 본편 구조에 이식한다. 이 문서는 현재 `ppap`에서 미니게임이 어디에 들어갔는지와, 어떤 경계로 유지해야 하는지를 정리한다.

## 이식 범위

- 활성 레거시 미니게임
  - `QuizScene`
  - `RhythmScene`
  - `InterviewScene`
  - `RunnerScene`
  - `TankScene`
  - `TypingScene`
  - `BusinessSmileScene`
  - `DontSmileScene`
  - `GymScene`
  - `CookingScene`
  - `LottoScene`
  - `DrinkingScene`
- 비활성 레거시 미니게임
  - `DragScene`
- 비활성 실험용 미니게임
  - `MiniGameTypingScene`
  - `MiniGameReflexScene`
  - `MiniGameCenterScene`

## 배치 원칙

- 실행 씬은 `src/game/scenes/**` 에 둔다.
- 공통 진입/복귀 계약은 `src/features/minigame/**` 에 둔다.
- 미니게임 에셋 경로와 런타임 파일 경로는 `src/game/definitions/assets/minigameAssetCatalog.ts` 에 둔다.
- 실제 정적 파일은 `public/assets/game/minigame/**`, `public/assets/game/audio/BGM/**` 를 사용한다.

## 현재 폴더 구조

- `src/game/scenes/legacyMinigames`
  - `shard` 레거시 미니게임 원본 이식본
- `src/game/scenes/minigames`
  - 실험형 미니게임과 미니게임 센터
- `src/features/minigame`
  - `minigameSceneKeys.ts`
  - `minigameCatalog.ts`
  - `minigameLauncher.ts`
  - `MinigameGateway.ts`
  - `lottoOutcome.ts`
- `src/features/minigame/legacy`
  - 레거시 씬이 의존하는 설정 파일

## 진입 방식

- 기본 진입은 `MainScene` 디버그 입력에서 `M` 키로 미니게임 메뉴를 여는 방식이다.
- `?minigame=true` 쿼리로 실행하면 `PreloadScene` 뒤에 바로 레거시 미니게임 메뉴를 연다.

## 유지보수 규칙

- 새 미니게임 씬을 추가하면 `src/app/registry/sceneRegistry.ts` 에 반드시 등록한다.
- 미니게임 카드 메뉴에 노출할 씬이면 `src/features/minigame/minigameCatalog.ts` 와 `src/features/minigame/minigameSceneKeys.ts` 를 같이 수정한다.
- 이미지/오디오가 필요한 미니게임은 경로 문자열을 씬에 직접 박지 말고 `src/game/definitions/assets/minigameAssetCatalog.ts` 를 통해 관리한다.
- 메인 게임과 결과를 연결할 때는 `MainScene`에 직접 로직을 넣기보다 `src/features/minigame/MinigameGateway.ts` 를 통해 연결한다.

## 현재 한계

- 월드 장소 상호작용과 미니게임 진입은 아직 연결되지 않았다.
- 보상, 스탯 반영, 저장 연동은 아직 게이트웨이 단계에서 비어 있다.
- 표정 인식 계열은 카메라 권한과 MediaPipe CDN 의존성이 필요하다.
