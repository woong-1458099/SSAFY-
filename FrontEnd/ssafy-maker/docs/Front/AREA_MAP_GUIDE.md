# Area/Map Guide

## 핵심 파일

- `src/common/enums/area.ts`
- `src/game/definitions/areas/areaDefinitions.ts`
- `src/game/definitions/places/areaTransitionDefinitions.ts`
- `src/game/definitions/places/placeDefinitions.ts`
- `src/game/managers/WorldManager.ts`
- `src/game/scenes/MainScene.ts`

## 책임 분리

- `areaDefinitions.ts`: 지역별 TMX 키, collision / interaction / foreground 레이어 계약, entry point
- `areaTransitionDefinitions.ts`: 지역 간 이동 타일 구역
- `WorldManager.ts`: TMX 로드, 해석, 그리드 생성, 렌더 범위 계산
- `MainScene.ts`: area 로드 후 플레이어 시작 타일과 상호작용 대상 연결

## 어떤 작업에서 이 문서를 보나

- 월드/캠퍼스/번화가 이동 포인트를 바꾸고 싶을 때
- 특정 지역의 entry point 를 바꾸고 싶을 때
- TMX 레이어 이름을 맞추고 싶을 때
- blocked zone / walkable zone 을 수정하고 싶을 때

## 실무 규칙

- 전이 좌표는 타일 단위 정의다.
- NPC 좌표는 픽셀 단위다.
- 맵이 이상하면 먼저 TMX 키와 레이어 이름 계약을 본다.
- 플레이어 시작 위치가 이상하면 `entryPoint`, 전이 복귀 스폰, blocked grid 순으로 확인한다.
