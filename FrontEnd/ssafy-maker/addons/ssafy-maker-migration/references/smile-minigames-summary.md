# 웃음 미니게임 정리

Date: 2026-03-09

## 목적

상위 `TypeScript/ai_smile_game.tsx`를 참고해 얼굴 인식 기반 미니게임 2종을 `ssafy-maker`에 추가했다.

- `BusinessSmileScene`
- `DontSmileScene`

두 게임 모두 로컬 Phaser 게임 허브 안에서 실행되며, MediaPipe를 이용한 카메라 기반 웃음 인식을 사용한다.

## 주요 파일

- `src/features/game/scenes/BusinessSmileScene.ts`
- `src/features/game/scenes/DontSmileScene.ts`
- `src/features/game/scenes/BaseSmileScene.ts`
- `src/features/game/scenes/faceTracking.ts`
- `src/features/game/scenes/MenuScene.ts`
- `src/PhaserGame.tsx`

## 실행 구조

### 공통 얼굴 추적 베이스

`BaseSmileScene.ts`

- 카메라 미니게임용 공통 Phaser 씬 구조를 제공한다
- Phaser 내부에 DOM 기반 카메라 캔버스를 생성한다
- 런타임에 MediaPipe 스크립트를 불러온다
- FaceMesh 랜드마크를 읽어 웃음 비율을 계산한다
- 카메라, FaceMesh, DOM 오버레이 정리를 담당한다

### MediaPipe 로더

`faceTracking.ts`

- `camera_utils.js`와 `face_mesh.js`를 한 번만 로드한다
- `FaceMesh`, `Camera`에 대한 최소 타입을 정의한다
- 얼굴 폭과 입 폭 거리 계산 함수를 제공한다

### BusinessSmileScene

- 목표: 웃음을 유지해 게이지를 100까지 채운다
- 웃으면 게이지가 상승한다
- 웃지 않으면 게이지가 감소한다
- 게이지를 모두 채우면 성공 화면으로 끝난다

### DontSmileScene

- 목표: 정색을 유지한 채 생존 시간을 버틴다
- 웃으면 위험 게이지가 빠르게 오른다
- 웃지 않으면 게이지가 천천히 줄고 생존 진행도가 올라간다
- 위험 게이지가 최대치가 되면 실패한다

## 메뉴 통합

`MenuScene.ts`

- 메뉴 레이아웃이 8칸에서 10칸으로 확장되었다
- `BusinessSmileScene`, `DontSmileScene` 카드가 추가되었다
- 랜덤 슬롯에도 두 웃음 게임이 포함된다

## Phaser 통합

`PhaserGame.tsx`

- 두 씬을 로컬 Phaser 씬 목록에 등록한다
- `dom.createContainer: true`로 Phaser DOM 컨테이너를 활성화한다

## 참고 사항

두 미니게임은 다음 조건에 의존한다.

- 브라우저 카메라 권한
- 런타임 MediaPipe CDN 스크립트 접근

카메라 권한이 차단되거나 CDN 스크립트를 불러오지 못하면 정상 실행 대신 카메라 오류 상태를 표시한다.
