# 현재 구현 상태 요약

Date: 2026-03-10

## 개요

`ssafy-maker`는 현재 로그인 이후 별도 외부 프로젝트로 이동하지 않고, 내부에서 바로 필드 허브와 Phaser 기반 미니게임 센터를 실행하는 구조다.

현재 반영된 핵심 변경은 다음과 같다.

- 로그인 후 게임 허브 직접 진입 구조 유지
- 미니게임 9종 로컬 등록
- 웃음 인식 미니게임 2종 추가
- 필드형 허브 + NPC 상호작용 진입 구조 추가
- 공통 Pause 오버레이 및 재개/종료 흐름 추가
- 사용자 노출 문구 한글화
- 인코딩 안정화를 위한 UTF-8 설정 추가

## 로그인 이후 구조

로그인 성공 후 `GameScreen`이 열리고, 내부에서 `PhaserGame`을 마운트한다.

관련 파일:

- `src/features/game/GameScreen.tsx`
- `src/PhaserGame.tsx`

현재 게임 화면 안내 문구는 모두 한글로 변경되었다.

## 미니게임 구성

현재 허브에서 접근 가능한 미니게임은 총 9종이다.

- 퀴즈
- 리듬
- 정렬
- 버그잡기
- 러너
- 에임
- 타이핑
- 비즈니스 웃음
- 웃음참기

관련 씬 파일:

- `src/features/game/scenes/QuizScene.ts`
- `src/features/game/scenes/RhythmScene.ts`
- `src/features/game/scenes/DragScene.ts`
- `src/features/game/scenes/BugScene.ts`
- `src/features/game/scenes/RunnerScene.ts`
- `src/features/game/scenes/AimScene.ts`
- `src/features/game/scenes/TypingScene.ts`
- `src/features/game/scenes/BusinessSmileScene.ts`
- `src/features/game/scenes/DontSmileScene.ts`

## 웃음 인식 미니게임

상위 `TypeScript/ai_smile_game.tsx`를 참고해 다음 두 씬이 추가되었다.

- `BusinessSmileScene`
- `DontSmileScene`

공통 기반:

- `src/features/game/scenes/BaseSmileScene.ts`
- `src/features/game/scenes/faceTracking.ts`

구조:

- MediaPipe FaceMesh를 런타임에 로드
- 카메라 입력을 받아 입 폭 / 얼굴 폭 비율 계산
- 비즈니스 웃음: 웃음을 유지해 게이지를 채우는 방식
- 웃음참기: 웃지 않고 버티며 위험 게이지를 관리하는 방식

주의 사항:

- 브라우저 카메라 권한 필요
- MediaPipe CDN 접근 필요

## 필드 허브 및 NPC 구조

기존 단순 카드 메뉴 대신 `MenuScene`이 필드형 허브 역할을 수행한다.

관련 파일:

- `src/features/game/scenes/MenuScene.ts`

현재 허브 기능:

- `WASD` / 방향키 이동
- 캠퍼스형 배경 및 오브젝트 표시
- `게임 마스터` NPC 배치
- NPC 근처에서 `E` 입력 시 미니게임 선택 패널 오픈
- 선택 패널에서 9개 미니게임 카드 선택 가능
- 허브에서 `ESC`로 선택 패널 닫기 가능

## Pause / 종료 구조

모든 미니게임에 공통 Pause 흐름이 연결되어 있다.

관련 파일:

- `src/features/game/scenes/MinigamePauseScene.ts`
- `src/features/game/scenes/installMinigamePause.ts`

현재 동작:

- 미니게임 플레이 중 `ESC` 입력
  - Pause 오버레이 표시
- Pause 상태에서 `E` 입력
  - 현재 게임 재개
- Pause 상태에서 `ESC` 입력
  - 현재 게임 종료
  - `MenuScene` 허브로 복귀

Pause 헬퍼 적용 대상:

- `QuizScene`
- `RhythmScene`
- `DragScene`
- `BugScene`
- `RunnerScene`
- `AimScene`
- `TypingScene`
- `BusinessSmileScene`
- `DontSmileScene`

## 씬 등록 구조

`PhaserGame.tsx`에서 현재 다음 요소를 등록한다.

- 허브 씬 `MenuScene`
- Pause 씬 `MinigamePauseScene`
- 9개 미니게임 씬

또한 웃음 인식 씬을 위해 Phaser DOM 컨테이너 옵션이 활성화되어 있다.

## 한글화 및 깨짐 대응

사용자에게 직접 보이는 주요 문구는 현재 한글로 교체되었다.

수정 대상 예시:

- 게임 로비 헤더
- Phaser 상단 배너
- 필드 허브 안내 문구
- NPC 상호작용 문구
- Pause 오버레이 문구
- 웃음 게임 상태 문구 / 결과 문구

문자 깨짐 원인 정리:

- 일부 기존 파일에 이미 깨진 문자열이 저장되어 있었음
- 터미널 또는 편집기 코드페이지가 UTF-8이 아니면 한글이 깨져 보일 수 있음

대응:

- 사용자 노출 문자열을 정상 한글로 재작성
- 프로젝트 루트에 `.editorconfig` 추가
- `charset = utf-8` 설정 적용

관련 파일:

- `.editorconfig`

## 기존 메모 파일

세부 구현은 아래 문서에도 정리되어 있다.

- `long-term-memory/game-integration-summary.md`
- `long-term-memory/minigame-catalog.md`
- `long-term-memory/smile-minigames-summary.md`
- `long-term-memory/field-hub-and-pause-summary.md`

## 현재 상태 결론

현재 `ssafy-maker`는 다음 흐름을 지원한다.

1. 로그인
2. 게임 화면 진입
3. 필드 허브 시작
4. NPC에게 이동
5. `E`로 미니게임 선택창 열기
6. 9개 미니게임 중 하나 실행
7. 플레이 중 `ESC`로 일시정지
8. `E`로 재개 또는 `ESC`로 허브 복귀

현재까지의 변경사항은 long-term-memory에 저장 완료된 상태다.
