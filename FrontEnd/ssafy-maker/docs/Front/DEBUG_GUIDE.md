# Debug Guide

## 핵심 파일

- `src/debug/services/DebugInputController.ts`
- `src/debug/overlay/DebugOverlay.ts`
- `src/debug/services/DebugEventLogger.ts`
- `src/debug/config/debugFlags.ts`
- `src/game/scenes/MainScene.ts`

## 디버그 입력

- `F1`: 디버그 오버레이 토글
- `F2`: 월드 그리드 토글
- `F3`: 디버그 패널 토글
- `T`: 마우스 월드 좌표로 플레이어 순간이동
- `M`: 미니게임 HUD 토글
- `1`: 월드 기본 시작 씬으로 전환
- `2`: 번화가 기본 시작 씬으로 전환
- `3`: 캠퍼스 기본 시작 씬으로 전환

## 이 문서를 볼 때

- 좌표를 잡아야 할 때
- 플레이어가 어디에서 막히는지 확인할 때
- 현재 어느 scene script가 실행되는지 확인할 때
- NPC가 실제로 어느 좌표에 떠 있는지 확인할 때

## 주의할 점

- 오버레이는 상태를 보여주는 용도다. 실제 수정은 `definitions`, `scripts`, `managers` 쪽에서 한다.
- 디버그가 안 보이면 `debugFlags.ts`부터 확인한다.
