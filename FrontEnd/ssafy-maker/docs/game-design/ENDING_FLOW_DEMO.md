# ENDING_FLOW_DEMO

## 왜 완충 씬을 넣었는가

6주차 일요일 밤이 끝나자마자 바로 엔딩 결과를 띄우면 플레이 감정선이 끊깁니다.
이번 데모는 아래 순서로 완충 구간을 넣어 자연스럽게 마무리되도록 구성했습니다.

1. `FinalSummaryScene`
2. `EndingIntroScene`
3. `EndingComicScene`

즉, 주차 종료 직후 곧바로 엔딩명이 튀어나오는 대신:
- 밤 회고
- 최종 정산
- 다음 날 수료식/마지막 면담 느낌
- "그 후..." 전환
- 4컷 엔딩 데모

순서로 마무리됩니다.

## MainScene 연결 지점

엔딩 진입은 [MainScene](C:/Users/서구뒷짱/OneDrive/바탕%20화면/SSAFY/특화/S14P21E206/FrontEnd/ssafy-maker/src/scenes/MainScene.ts)에 연결되어 있습니다.

핵심 함수:
- `spendActionPoint()`
- `shouldTriggerEndingFlow(...)`
- `buildEndingPayload()`
- `startEndingFlow()`

동작 방식:
- `spendActionPoint()`에서 밤이 지나 새 날로 넘어갈 때 `week`가 증가합니다.
- 그 시점에 `week > 6`이 되면 `FinalSummaryScene`으로 진입합니다.
- 자동 저장은 기존 흐름을 유지하면서 엔딩 직전에도 `auto` 슬롯에 저장합니다.

## 체력과 협업 값을 이렇게 쓴 이유

- 체력은 새 전역 statKey를 만들지 않고 기존 HUD 값인 `hudState.hp`를 사용합니다.
  현재 프로젝트에서 체력에 가장 가까운 값이 이미 HUD에 있기 때문입니다.
- 협업은 기존 `statsState.teamwork`를 사용합니다.
  이미 MainScene 내부 스탯 구조에 포함되어 있어 기존 시스템을 그대로 활용할 수 있습니다.

## 씬별 역할

### FinalSummaryScene
- 최종 스탯 표시
- 엔딩 판정 계산
- 다음 씬으로 전달할 데이터 구성

### EndingIntroScene
- 밤 회고
- 다음 날 수료식/마지막 면담 느낌
- 대표 NPC 또는 시스템 메시지
- "그 후..." 전환

### EndingComicScene
- 4컷 플레이스홀더 패널 표시
- 엔딩명 / 한줄 설명 표시
- 다시보기 / 타이틀로 버튼 제공

## 실제 4컷 이미지로 교체할 때 바꿔야 할 지점

현재 4컷은 [EndingComicScene](C:/Users/서구뒷짱/OneDrive/바탕%20화면/SSAFY/특화/S14P21E206/FrontEnd/ssafy-maker/src/scenes/EndingComicScene.ts)에서
`ending.comicPanels` 데이터를 사용해 rectangle 기반 플레이스홀더로 그립니다.

나중에 실제 이미지로 바꿀 때:
- `resolveEnding()`에서 `comicPanels`에 이미지 키나 경로를 추가
- `EndingComicScene.createComicGrid()`에서 rectangle 대신 image/sprite 사용

즉, 엔딩 데이터 구조는 유지하고 렌더링만 바꾸면 됩니다.

## F8 디버그 진입

개발 중 빠른 확인을 위해 [MainScene](C:/Users/서구뒷짱/OneDrive/바탕%20화면/SSAFY/특화/S14P21E206/FrontEnd/ssafy-maker/src/scenes/MainScene.ts)에 `F8` 디버그 키가 추가되어 있습니다.

사용 방법:
- MainScene 진입
- `F8` 입력
- 현재 스탯/HUD 상태 기준으로 `FinalSummaryScene`으로 즉시 이동
