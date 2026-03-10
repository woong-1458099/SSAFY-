# 필드 허브 및 일시정지 정리

Date: 2026-03-09

## 목적

`ssafy-maker`의 미니게임 진입 구조를 단순 카드 메뉴에서 상위 `SSAFYTraineeRaisingWeb`를 참고한 필드형 허브 구조로 변경했다.

현재 플레이 흐름은 다음과 같다.

- 캠퍼스 형태의 필드 허브에 진입한다
- `WASD` 또는 방향키로 이동한다
- NPC에게 다가간다
- `E`를 눌러 미니게임 선택창을 연다
- NPC 패널에서 9종 미니게임 중 하나를 시작한다

또한 모든 미니게임은 공통 일시정지 및 종료 흐름을 지원한다.

## 주요 파일

- `src/features/game/scenes/MenuScene.ts`
- `src/features/game/scenes/MinigamePauseScene.ts`
- `src/features/game/scenes/installMinigamePause.ts`
- `src/PhaserGame.tsx`

## 필드 허브 구조

### MenuScene

`MenuScene.ts`

- 더 이상 정적인 카드 메뉴가 아니다
- 필드 허브의 메인 씬 역할을 담당한다
- 캠퍼스 배경과 건물 오브젝트를 그린다
- 플레이어 아바타를 생성한다
- `게임 마스터` NPC를 생성한다
- 플레이어가 가까워지면 상호작용 안내를 보여준다

### 조작

- `WASD` 또는 방향키: 이동
- `E`: NPC 상호작용 및 미니게임 패널 열기
- `ESC`: 허브에서 미니게임 선택 패널 닫기

### NPC 미니게임 선택창

- 필드 위에 오버레이 패널 형태로 열린다
- 로컬 9개 미니게임이 모두 들어간다
- 카드를 클릭하면 해당 씬이 시작된다

## 미니게임 일시정지 흐름

### Pause 오버레이 씬

`MinigamePauseScene.ts`

- 미니게임 일시정지 전용 오버레이 씬으로 추가되었다
- 다음 안내를 표시한다
  - `일시정지`
  - `게임이 멈춘 상태입니다`
  - `E: 계속하기`
  - `ESC: 허브로 나가기`

### 공통 Pause 설치기

`installMinigamePause.ts`

- 미니게임 씬에서 재사용 가능한 헬퍼로 추가되었다
- 현재 미니게임 씬에서 `ESC` 입력을 등록한다
- `MinigamePauseScene`을 실행한다
- Pause 씬을 최상단 레이어로 올린다
- 아래의 현재 미니게임 씬을 일시정지한다

### Pause 조작

- 미니게임 플레이 중 `ESC`를 누르면 Pause 오버레이가 열린다
- Pause 상태에서 `E`를 누르면 현재 미니게임을 재개한다
- Pause 상태에서 `ESC`를 누르면 현재 미니게임을 종료하고 `MenuScene`으로 돌아간다

## 적용된 씬

Pause 헬퍼는 다음 씬에 연결되어 있다.

- `QuizScene`
- `RhythmScene`
- `DragScene`
- `BugScene`
- `RunnerScene`
- `AimScene`
- `TypingScene`
- `BusinessSmileScene`
- `DontSmileScene`

웃음 인식 게임은 `BaseSmileScene.ts`를 통해 Pause 기능이 공통 적용된다.

## Phaser 등록

`PhaserGame.tsx`

- `MenuScene`을 필드 허브 시작 씬으로 등록한다
- `MinigamePauseScene`을 등록해 어떤 미니게임에서도 Pause 오버레이를 띄울 수 있게 한다
- 웃음 인식 씬을 위해 DOM 지원을 유지한다

## 참고 사항

현재 게임 흐름은 다음과 같다.

1. 로그인
2. 게임 화면 진입
3. 필드 허브에서 시작
4. NPC에게 이동
5. `E` 입력
6. 9개 미니게임 중 하나 선택
7. 플레이 중 `ESC`로 일시정지
8. `E`로 재개하거나 `ESC`로 허브 복귀
