# 로그인/오프닝/엔딩 이식 분석 보고서

## 1. 목적

- 현재 작업 저장소: `C:\Users\SSAFY\Downloads\gitcom\github\S14P21E206\FrontEnd\ssafy-maker`
- 이식 원본 저장소: `C:\Users\SSAFY\Downloads\gitcom\shard\S14P21E206\FrontEnd\ssafy-maker`
- 목표: 원본 저장소에 있는 로그인, 오프닝, 엔딩 흐름을 현재 작업 저장소에 안전하게 이식하기 위한 작업 순서와 영향 범위를 정리한다.

## 2. 결론 요약

이번 작업은 단순히 `LoginScene`, `IntroScene`, `Ending*Scene` 파일 몇 개를 복사하는 수준이 아니다. 원본 저장소의 로그인/오프닝/엔딩은 다음 요소들과 묶여 있다.

- 씬 등록 체계
- 인증 세션 처리 (`features/auth`)
- 시작 화면 및 캐릭터 생성 흐름 (`StartScene`, `NewCharacterScene`)
- 메인 씬의 시간 진행과 엔딩 트리거 로직
- 엔딩 요약/연출 데이터 모델 (`features/progression/types/ending`, `endingResolver`, `timeProgression`)
- 일부 공용 자산 프리로드 구조

즉, 이식 단위는 "씬 단위"가 아니라 "진입 플로우 + 상태 전이 + 의존 모듈 묶음"으로 보는 것이 맞다.

## 3. 현재 확인 결과

### 3.1 현재 작업 저장소 상태

현재 저장소는 구조상 아래 흐름에 가깝다.

- `BootScene -> PreloadScene -> MainScene`
- 씬 키는 `src/common/enums/scene.ts`의 `boot`, `preload`, `main`
- 메인 게임 로직은 `src/game/scenes/MainScene.ts`와 매니저 계층 중심
- `src/features/progression/TimeService.ts`는 기본 시간 증가만 처리
- `src/features/progression/EndingService.ts`는 실질 구현이 비어 있음

즉, 로그인/시작/오프닝/엔딩용 진입 체인이 아직 없다.

### 3.2 원본 저장소 상태

원본 저장소는 아래 흐름을 가진다.

- `BootScene -> PreloadScene -> LoginScene -> StartScene -> IntroScene -> NewCharacterScene -> MainScene`
- 메인 종료 시 `CompletionScene -> FinalSummaryScene -> EndingIntroScene -> EndingComicScene`
- 인증은 `src/features/auth/api.ts`, `src/features/auth/authSession.ts` 사용
- 엔딩은 `src/features/progression/services/timeProgression.ts`, `src/features/progression/services/endingResolver.ts`, `src/features/progression/types/ending.ts` 기반
- 메인 씬 진행은 `MainSceneProgressionRuntime`가 엔딩 시작 시점을 제어

### 3.3 자산 현황

현재 저장소에도 아래 자산은 이미 존재한다.

- `public/assets/game/backgrounds/yeoksam*.png`
- `public/assets/game/backgrounds/subway_*`
- `public/assets/game/backgrounds/pass_SF*.png`
- `public/assets/game/backgrounds/flashback/*`
- `public/assets/game/ui/logo.png`
- `public/assets/game/ui/new_game.png`
- `public/assets/game/ui/old_game.png`
- `public/assets/game/audio/BGM/MainTheme.mp3`
- `public/assets/game/audio/BGM/Completion.mp3`
- `public/assets/game/audio/BGM/Event2.mp3`
- `public/assets/game/audio/SoundEffect/click.wav`
- `public/assets/game/audio/SoundEffect/click2.mp3`
- `public/assets/game/audio/SoundEffect/train.mp3`
- `public/assets/game/audio/SoundEffect/door_open.mp3`
- `public/assets/game/audio/SoundEffect/voice_male.wav`
- `public/assets/game/audio/SoundEffect/voice_female.wav`
- `public/assets/game/audio/SoundEffect/type.mp3`

따라서 이번 포팅의 핵심 난점은 자산 복사보다 코드 구조 정합성이다.

## 4. 주요 차이점

### 4.1 씬 레지스트리 차이

현재 저장소:

- `src/app/registry/sceneRegistry.ts`
- 핵심 씬은 `boot`, `preload`, `main`만 관리
- 미니게임 레거시 씬 무결성 검사까지 포함

원본 저장소:

- `src/app/registry/scenes.ts`
- 로그인, 시작, 오프닝, 캐릭터 생성, 엔딩 씬까지 모두 등록

영향:

- 현재 저장소에 로그인/오프닝/엔딩을 넣으려면 씬 키 상수와 레지스트리 설계를 먼저 확장해야 한다.

### 4.2 디렉터리 구조 차이

현재 저장소:

- `src/game/*`, `src/common/*`, `src/features/*`

원본 저장소:

- `src/scenes/*`, `src/shared/*`, `src/core/*`, `src/features/*`

영향:

- 원본 파일을 그대로 복사하면 import 경로가 대량으로 깨진다.
- 특히 `@shared/*`, `@core/*`, `@scenes/*` 기준으로 짜인 파일은 현재 구조에 맞춰 재배치하거나 어댑터를 둬야 한다.

### 4.3 메인 씬 책임 분리 수준 차이

현재 저장소:

- `MainScene`와 여러 manager가 강하게 결합
- 저장/복원/시간 진행/스토리/플레이어 이동이 한 흐름 안에 묶여 있음

원본 저장소:

- `MainSceneProgressionRuntime`, `MainSceneFlowRuntime`, `MainSceneStoryRuntime` 등으로 세분화

영향:

- 엔딩 트리거 로직만 떼어오려면 현재 `ProgressionManager`와 `TimeService`를 직접 확장하는 편이 비용이 낮다.
- 원본의 `MainSceneProgressionRuntime` 전체를 그대로 이식하는 방식은 구조 충돌 가능성이 크다.

### 4.4 인증 체계 차이

현재 저장소:

- `src/features/auth/AuthGateway.ts` 존재
- 실제 로그인 씬/세션 복구 흐름은 없음

원본 저장소:

- `LoginScene`가 `authSession.ts`를 통해 백엔드 세션 확인, 리다이렉트 복귀, 개발용 우회 진입까지 처리

영향:

- 로그인만 단독 이식해도 `LoginScene + authSession.ts + api.ts + SceneKey/PreloadScene/StartScene 연계`가 필요하다.

## 5. 이식 범위별 분석

### 5.1 로그인

필수 이식 후보:

- `src/scenes/LoginScene.ts`
- `src/features/auth/api.ts`
- `src/features/auth/authSession.ts`

현재 저장소 반영 포인트:

- `src/game/scenes/PreloadScene.ts`의 종료 지점을 `main`에서 `login` 또는 분기 가능한 시작 씬으로 변경
- 현재 인증 구조(`AuthGateway.ts`)와 역할 중복 여부 확인
- `registry`에 `authToken`, `authUser` 저장 규약 추가

예상 리스크:

- 백엔드 API 경로가 현재 환경과 다를 수 있음
- 현재 저장소의 인증 전략과 충돌 가능

권장 방식:

- 1차는 개발용 bypass 포함한 UI/흐름 포팅
- 2차에서 실제 백엔드 연동 검증

### 5.2 오프닝

필수 이식 후보:

- `src/scenes/IntroScene.ts`
- `src/features/intro/introAssets.ts`
- `src/features/intro/introContent.ts`

연계 필요:

- `StartScene`
- `NewCharacterScene`

현재 저장소 반영 포인트:

- 현재 저장소의 플레이어 생성 방식이 이미 있다면 `NewCharacterScene` 전체 포팅 대신 "오프닝 종료 후 어디로 갈지"를 현재 생성 흐름에 맞춰 연결해야 한다.
- 현재 `MainScene`은 `registry.playerData` 기반 외형 해석을 이미 사용하므로, 캐릭터 생성 포팅 시 `playerData` 규약을 맞추는 것이 중요하다.

예상 리스크:

- 현재 저장소의 플레이어 외형/초기화 방식과 원본 `NewCharacterScene`의 저장 형식이 다를 수 있음
- 인트로 스킵/사운드 정지/씬 전환 시 중복 이벤트 정리 누락 가능

권장 방식:

- 오프닝은 `IntroScene` 단독 이식이 아니라 `StartScene`과 함께 묶어서 이식
- `IntroScene` 종료 목적지를 현재 저장소 기준으로 재결정

### 5.3 엔딩

필수 이식 후보:

- `src/scenes/CompletionScene.ts`
- `src/scenes/FinalSummaryScene.ts`
- `src/scenes/EndingIntroScene.ts`
- `src/scenes/EndingComicScene.ts`
- `src/features/completion/*`
- `src/features/progression/types/ending.ts`
- `src/features/progression/services/endingResolver.ts`
- `src/features/progression/services/timeProgression.ts`

현재 저장소 반영 포인트:

- `src/features/progression/TimeService.ts`에 엔딩 시작 컷오프 규칙 추가 여부 결정
- `src/game/managers/ProgressionManager.ts`에 엔딩 진입 상태 추가 필요
- `src/game/scenes/MainScene.ts`에서 엔딩 시작 시 메인 흐름을 끊고 `CompletionScene`으로 넘기는 브리지 필요
- 현재 HUD/스탯 키와 원본 엔딩 스탯 키(`fe`, `be`, `teamwork`, `hp`, `luck`) 매핑 필요

예상 리스크:

- 현재 저장소 스탯 모델이 원본과 완전히 같지 않을 수 있음
- 저장/복원 중 엔딩 직전 상태와 씬 전환 상태가 꼬일 수 있음

권장 방식:

- 엔딩은 원본 `MainSceneProgressionRuntime`를 그대로 가져오지 말고, 현재 `ProgressionManager`와 `TimeService`에 필요한 규칙만 흡수하는 방식이 안전하다.

## 6. 권장 이식 순서

### Phase 1. 진입 구조 정리

1. 씬 키 확장
2. 씬 레지스트리에 로그인/시작/인트로/엔딩 씬 등록 가능 구조 추가
3. `BootScene`, `PreloadScene` 시작 흐름 재정의

이 단계의 목표:

- 현재 저장소가 `MainScene` 직행 구조에서 벗어나도 깨지지 않게 만드는 것

### Phase 2. 로그인 + 시작 화면 이식

1. `LoginScene`
2. `features/auth/api.ts`
3. `features/auth/authSession.ts`
4. `StartScene`

이 단계의 목표:

- 세션 확인, 로그인, 개발용 bypass, 시작 화면 진입까지 연결

### Phase 3. 오프닝 이식

1. `IntroScene`
2. `features/intro/*`
3. 필요 시 `NewCharacterScene`

이 단계의 목표:

- `StartScene -> IntroScene -> (캐릭터 생성 또는 MainScene)` 흐름 완성

### Phase 4. 엔딩 데이터 모델 이식

1. `types/ending.ts`
2. `endingResolver.ts`
3. `timeProgression.ts`의 엔딩 판단 규칙 참고
4. 현재 저장소 `TimeService`, `ProgressionManager`에 맞는 어댑터 구현

이 단계의 목표:

- 현재 프로젝트 스탯/시간 체계에서 엔딩 진입 조건을 계산 가능하게 만드는 것

### Phase 5. 엔딩 씬 이식

1. `CompletionScene`
2. `FinalSummaryScene`
3. `EndingIntroScene`
4. `EndingComicScene`
5. `features/completion/*`

이 단계의 목표:

- 메인 플레이 종료 후 엔딩 UI 흐름 완성

### Phase 6. 저장/복원 및 회귀 테스트

1. 로그인 안 된 상태 진입
2. bypass 로그인
3. 새 게임 시작
4. 인트로 스킵
5. 메인 진입
6. 엔딩 강제 진입
7. 엔딩 도중 재진입/재시작

## 7. 실제 작업 시 추천 전략

### 추천 전략 A: 부분 흡수 방식

현재 저장소 구조를 유지하면서 필요한 기능만 흡수한다.

- 로그인: `LoginScene`, `authSession`, `api`만 이식
- 오프닝: `StartScene`, `IntroScene`, 필요한 자산 로더만 이식
- 엔딩: 원본 `endingResolver`, `CompletionScene` 계열만 가져오고 현재 `ProgressionManager`에 브리지 작성

장점:

- 현재 저장소의 `game/manager` 구조를 유지할 수 있음
- 충돌 범위가 상대적으로 작음

단점:

- 원본 구조를 그대로 재사용하지 못해 연결 코드가 필요함

### 추천 전략 B: 흐름 단위 대규모 포팅

원본의 `Start/Login/Intro/Main progression runtime/Ending` 묶음을 통째로 재현한다.

장점:

- 원본 동작 재현도는 높음

단점:

- 현재 저장소 `MainScene`, `ProgressionManager`, 저장 구조와 충돌 가능성이 매우 큼
- 작업 범위가 크게 늘어남

최종 권장:

- 전략 A를 추천한다.

## 8. 예상 수정 파일 범위

현재 저장소 기준으로 우선 영향이 큰 파일은 아래와 같다.

- `src/common/enums/scene.ts`
- `src/app/registry/sceneRegistry.ts`
- `src/game/scenes/BootScene.ts`
- `src/game/scenes/PreloadScene.ts`
- `src/game/scenes/MainScene.ts`
- `src/game/managers/ProgressionManager.ts`
- `src/features/progression/TimeService.ts`
- `src/features/progression/EndingService.ts`

신규 추가 가능성이 높은 파일/디렉터리:

- `src/game/scenes/LoginScene.ts` 또는 별도 `src/scenes/*` 계층
- `src/game/scenes/StartScene.ts`
- `src/game/scenes/IntroScene.ts`
- `src/game/scenes/CompletionScene.ts`
- `src/game/scenes/FinalSummaryScene.ts`
- `src/game/scenes/EndingIntroScene.ts`
- `src/game/scenes/EndingComicScene.ts`
- `src/features/auth/*`
- `src/features/intro/*`
- `src/features/completion/*`
- `src/features/progression/types/ending.ts`

## 9. 선행 확인 필요 항목

실제 포팅 시작 전에 아래를 먼저 확인하는 것이 좋다.

1. 현재 저장소에서 로그인 후 사용자 정보가 실제로 필요한지, 아니면 우선 bypass 중심으로 붙일지
2. 오프닝 뒤에 반드시 `NewCharacterScene`이 필요한지, 아니면 기존 플레이어 생성 규약만 맞추면 되는지
3. 엔딩 스탯 산식이 원본 그대로여야 하는지, 아니면 현재 저장소의 스탯 시스템에 맞춰 재정의할지
4. 씬 파일을 `src/game/scenes`에 합칠지, 원본처럼 `src/scenes`를 새로 둘지

## 10. 최종 제안

가장 안전한 첫 착수 순서는 아래와 같다.

1. 씬 키/레지스트리/Preload 진입점 확장
2. `LoginScene + authSession + api` 이식
3. `StartScene + IntroScene` 이식
4. 현재 `ProgressionManager`에 엔딩 트리거 규칙 추가
5. `CompletionScene -> FinalSummaryScene -> EndingIntroScene -> EndingComicScene` 이식
6. 저장/복원 및 스킵 동작 회귀 테스트

이 순서로 진행하면 로그인과 오프닝이 먼저 독립적으로 검증되고, 엔딩은 메인 진행 로직을 이해한 뒤 후반에 붙일 수 있어서 실패 비용이 가장 낮다.
