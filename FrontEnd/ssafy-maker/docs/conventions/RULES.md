# RULES

## 1) Feature 폴더 우선

- 신규 기능은 `src/features/<feature-name>` 아래에 작성합니다.
- 기능 코드는 해당 feature 내부에서 끝나도록 구성합니다.

## 2) core/shared 사용 제한

- `src/core`: 엔진/게임 전반 공통 인프라(매니저, 이벤트, 상수)만 허용
- `src/shared`: 타입, enum, 공통 UI 베이스처럼 재사용 근거가 명확한 항목만 허용
- "일단 공용" 목적의 코드 이동 금지

## 3) 에셋 분리 규칙

- 원본: `assets/raw`
- 실사용: `assets/game`
- 런타임 로딩 대상은 `assets/game`만 허용

## 4) 씬 등록 단일화

- 씬 등록은 `src/app/registry/scenes.ts`에서만 관리
- 다른 파일에서 씬 목록 직접 구성 금지

## 5) feature 간 결합 최소화

- 직접 참조 대신 `shared/types`, `EventBus` 중심으로 연결
- 타 feature의 내부 구현 파일 import 금지

## 6) 미니게임 독립성

- 각 미니게임은 `src/features/minigames/minigame-xxx` 내부에서 완결
- 공통 요소만 `src/features/minigames/common`으로 이동

## 7) story / progression 분리

- story 데이터: `assets/game/data/story`
- story 로직: `src/features/story`
- progression(스탯/일정/엔딩): `src/features/progression`에서 독립 관리

## 8) AI 계층 분리

- 도메인 로직: `src/features/ai`
- 외부 연동: `src/infra/ai`

## 9) 네이밍 규칙

- 파일/폴더: `kebab-case`
- 클래스/타입: `PascalCase`
- 변수/함수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`

## 10) import 경로 규칙

- alias 우선 사용: `@app`, `@core`, `@shared`, `@features`, `@scenes`, `@infra`
- 상대경로 `../../..` 과다 사용 금지

## 11) 팀별 소유권 준수

- 소유 폴더 외 수정 시 사전 합의 후 진행
- 공용 폴더 수정은 PR 설명에 영향 범위 명시

## 12) 금지 예시

- `assets/raw` 파일을 코드에서 직접 preload
- UI feature가 story feature 내부 model 직접 수정
- 씬 등록 파일 외부에서 scene 배열 하드코딩