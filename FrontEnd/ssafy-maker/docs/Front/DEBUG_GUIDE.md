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
- `1` 또는 `NumPad 1`: 월드 기본 시작 씬으로 전환
- `2` 또는 `NumPad 2`: 번화가 기본 시작 씬으로 전환
- `3` 또는 `NumPad 3`: 캠퍼스 기본 시작 씬으로 전환

## F3 패널

- 1페이지 `기본 디버그`: 현재 스탯, 시간, 재화, 행동력, 인벤토리와 기본 디버그 조작
- 2페이지 `스토리 디버그`: 주차별 고정 이벤트 목록, 설명 미리보기, 요구 스탯, 선택지 요약, 점프/실행/완료 초기화

스토리 디버그 페이지에서 가능한 작업:

- 주차 선택
- 주차 내 이벤트 선택
- 선택 이벤트 조건으로 점프
- 완료 기록 초기화 후 점프 또는 즉시 실행
- 선택 주차 완료 기록 초기화

## 이 문서를 볼 때

- 좌표를 잡아야 할 때
- 플레이어가 어디에서 막히는지 확인할 때
- 현재 어느 scene script가 실행되는지 확인할 때
- NPC가 실제로 어느 좌표에 떠 있는지 확인할 때

## 주의할 점

- 오버레이는 상태를 보여주는 용도다. 실제 수정은 `definitions`, `scripts`, `managers` 쪽에서 한다.
- 디버그가 안 보이면 `debugFlags.ts`부터 확인한다.
