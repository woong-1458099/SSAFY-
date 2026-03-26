# SSAFY생 키우기 (Phaser + TypeScript + Vite)

Unity에서 전환한 팀 프로젝트용 웹 게임 클라이언트입니다.

## 실행 방법

1. Node.js 25.x 설치
2. 의존성 설치
```bash
npm install
```
3. 개발 서버 실행
```bash
npm run dev
```
기본 API 경로는 `/api` 이고, 로컬 개발 시 Vite 프록시가 `http://localhost:8080` 으로 전달합니다.
배포 서버 기준 API 경로는 `VITE_API_BASE_URL` 로 덮어쓸 수 있고, 값에는 `/api` 까지 포함해야 합니다.
`VITE_API_BASE_URL` 의 query string 과 hash 는 무시됩니다.
4. 빌드
```bash
npm run build
```
5. 미리보기
```bash
npm run preview
```

## 권장 버전

- Node.js: `>=25 <26`
- npm: `>=11 <12`
- packageManager: `npm@11.11.0`

## 핵심 구조

- `assets/raw`: 원본 에셋
- `assets/game`: 런타임 사용 에셋
- `src/app`: 앱 시작점, 게임 설정, 씬 등록
- `src/scenes`: 공용 씬(Boot/Preload/Title/Main)
- `src/features`: 도메인 기능(UI, story, minigames, ai, progression)
- `src/core`: 공통 매니저, 이벤트, 상수
- `src/infra`: 외부 연동(storage/api/ai/loaders)
- `docs/conventions`: 팀 규칙 문서

## 씬 등록 원칙

씬 등록은 `src/app/registry/scenes.ts` 한 곳에서만 관리합니다.

## 문서

- 프론트 구현 맵: `docs/FRONTEND_IMPLEMENTATION_MAP.md`
- 규칙: `docs/conventions/RULES.md`
- 브랜치 전략: `docs/conventions/BRANCH_STRATEGY.md`
- 폴더 소유권: `docs/conventions/FOLDER_OWNERSHIP.md`
- 에셋 파이프라인: `docs/conventions/ASSET_PIPELINE.md`
- 환경 설정: `docs/conventions/ENVIRONMENT_SETUP.md`
- MR 리뷰 규칙: `docs/infra/REVIEW_RULES.md`
- MR 리뷰 구조 맵: `docs/infra/STRUCTURE_MAP.md`

## MR 리뷰 문서 동기화 규칙

- `src/app`, `src/scenes`, `src/features`, `src/core`, `src/infra`의 책임이나 연결 방식이 바뀌면 `docs/infra/STRUCTURE_MAP.md`도 같이 갱신합니다.
- MR 리뷰 AI가 참고하는 규칙, 금지 패턴, 체크리스트가 바뀌면 `docs/infra/REVIEW_RULES.md`도 같이 갱신합니다.
- 씬 등록 방식, 전역 이벤트 흐름, 외부 API 연동 경계가 바뀌면 코드 변경만 올리지 말고 문서 변경도 같은 MR에 포함합니다.
- PR/MR 작성 전에 현재 변경이 `docs/infra/REVIEW_RULES.md`, `docs/infra/STRUCTURE_MAP.md`와 어긋나는지 먼저 확인합니다.
