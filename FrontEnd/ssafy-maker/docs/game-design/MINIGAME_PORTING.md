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
- 제거된 레거시 미니게임
  - `DragScene`
- 비활성 실험용 미니게임
  - `MiniGameReflexScene`
  - `MiniGameCenterScene`
- 제거된 실험용 미니게임
  - `MiniGameTypingScene`

## 배치 원칙

- 실행 씬은 `src/game/scenes/**` 에 둔다.
- 공통 진입/복귀 계약은 `src/features/minigame/**` 에 둔다.
- 미니게임 에셋 경로와 런타임 파일 경로는 `src/game/definitions/assets/minigameAssetCatalog.ts` 에 둔다.
- 실제 정적 파일은 `public/assets/game/minigame/**`, `public/assets/game/audio/BGM/**` 를 사용한다.

## 현재 폴더 구조

- `src/game/scenes/minigames`
  - 모든 미니게임 씬 (레거시 + 실험형)
- `src/game/scenes/minigames/utils`
  - 공통 UI 유틸리티 (상수, 스타일, 컴포넌트 함수)
- `src/features/minigame`
  - `minigameSceneKeys.ts`
  - `minigameCatalog.ts`
  - `minigameLauncher.ts`
  - `MinigameGateway.ts`
  - `lottoOutcome.ts`
- `src/features/minigame/legacy`
  - 레거시 씬이 의존하는 설정 파일

## 공통 UI 유틸리티

`src/game/scenes/minigames/utils/` 에 공통 UI 요소를 모아둔다.

- `minigameConstants.ts` - 화면 크기, 색상 팔레트, 폰트
- `minigameStyles.ts` - 텍스트 스타일 프리셋
- `minigameUI.ts` - UI 생성 함수 (배경, 버튼, 패널 등)

### 사용 예시

```typescript
import { SCREEN, COLORS, PIXEL_FONT, createBackground, createButton, TEXT_STYLES } from './utils';

const { W, H } = SCREEN;

createBackground(this, 0x1a1a2e);
createButton(this, W / 2, 400, '시작', () => this.startGame(), {
  bgColor: COLORS.bgPanel,
  borderColor: COLORS.gold
});
```

### 제공 함수

- `createBackground(scene, color)` - 전체 화면 배경
- `createGridBackground(scene, gridSize, color, alpha)` - 그리드 패턴
- `createHeader(scene, title, options)` - 상단 헤더 UI
- `createPanel(scene, x, y, w, h, options)` - 패널/박스
- `createButton(scene, x, y, label, onClick, options)` - 버튼
- `createScoreText(scene, x, y, initialScore, prefix)` - 점수 텍스트
- `createTimerText(scene, x, y, initialTime, prefix)` - 타이머 텍스트
- `createTimerBar(scene, x, y, width, height, options)` - 타이머 바
- `createResultScreen(scene, options)` - 결과 화면
- `showJudgeText(scene, x, y, text, color, duration)` - 판정 텍스트
- `showScorePopup(scene, x, y, points, color)` - 점수 팝업
- `showParticleEffect(scene, x, y, count, color)` - 파티클 효과

## 진입 방식

- 기본 진입은 `MainScene` 디버그 입력에서 `M` 키로 미니게임 메뉴를 여는 방식이다.
- `?minigame=true` 쿼리로 실행하면 `PreloadScene` 뒤에 바로 레거시 미니게임 메뉴를 연다.

## 유지보수 규칙

- 새 미니게임 씬을 추가하면 `src/app/registry/sceneRegistry.ts` 에 반드시 등록한다.
- 미니게임 카드 메뉴에 노출할 씬이면 `src/features/minigame/minigameCatalog.ts` 와 `src/features/minigame/minigameSceneKeys.ts` 를 같이 수정한다.
- 제거한 미니게임 키는 `DEPRECATED_MINIGAME_SCENE_KEYS` 에 유지하고, registry/catalog에 다시 들어오지 않도록 self-check를 통과해야 한다.
- 이미지/오디오가 필요한 미니게임은 경로 문자열을 씬에 직접 박지 말고 `src/game/definitions/assets/minigameAssetCatalog.ts` 를 통해 관리한다.
- 메인 게임과 결과를 연결할 때는 `MainScene`에 직접 로직을 넣기보다 `src/features/minigame/MinigameGateway.ts` 를 통해 연결한다.
- 공통 UI 요소(배경, 버튼, 패널 등)는 `src/game/scenes/minigames/utils/` 유틸을 사용한다. 화면 크기, 색상, 폰트를 하드코딩하지 않는다.

## 현재 한계

- 월드 장소 상호작용과 미니게임 진입은 아직 연결되지 않았다.
- 보상, 스탯 반영, 저장 연동은 아직 게이트웨이 단계에서 비어 있다.
- 표정 인식 계열은 카메라 권한과 MediaPipe CDN 의존성이 필요하다.
