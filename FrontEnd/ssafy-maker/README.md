# SSAFY생 키우기 (Phaser + TypeScript + Vite)

Unity에서 전환한 팀 프로젝트용 웹 게임 클라이언트입니다.

## 실행 방법

1. Node.js 20.x 설치
2. 의존성 설치
```bash
npm install
```
3. 개발 서버 실행
```bash
npm run dev
```
4. 빌드
```bash
npm run build
```
5. 미리보기
```bash
npm run preview
```

## 권장 버전

- Node.js: `>=20 <21`
- npm: `>=10 <11`
- packageManager: `npm@10`

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

- 규칙: `docs/conventions/RULES.md`
- 브랜치 전략: `docs/conventions/BRANCH_STRATEGY.md`
- 폴더 소유권: `docs/conventions/FOLDER_OWNERSHIP.md`
- 에셋 파이프라인: `docs/conventions/ASSET_PIPELINE.md`
- 환경 설정: `docs/conventions/ENVIRONMENT_SETUP.md`