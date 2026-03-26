# ENVIRONMENT_SETUP

팀 전체 개발 환경을 맞추기 위한 기준 문서입니다.

## 1. 필수 버전

- Node.js: `25.x`
- npm: `11.x`

`package.json`의 `engines` 및 `.npmrc(engine-strict=true)` 기준을 따릅니다.

## 2. 초기 세팅

```bash
npm install
npm run dev
```

## 3. 빌드 확인

```bash
npm run build
```

빌드가 실패하면 PR 생성 전에 원인 해결이 우선입니다.

## 4. 에디터 권장

- VS Code
- 확장: ESLint, Prettier, EditorConfig (팀 합의 시)
- 파일 인코딩: UTF-8

## 5. 경로 alias

- `@app/*`
- `@core/*`
- `@shared/*`
- `@features/*`
- `@scenes/*`
- `@infra/*`

alias는 `tsconfig.json`, `vite.config.ts`를 함께 수정해야 합니다.

## 6. Git 기본 규칙

- 브랜치 전략: `docs/conventions/BRANCH_STRATEGY.md`
- 폴더 소유권: `docs/conventions/FOLDER_OWNERSHIP.md`

## 7. 자주 발생하는 문제

- 한글 깨짐: 파일 인코딩을 UTF-8로 재저장
- 모듈 인식 실패: `node_modules` 삭제 후 `npm install`
- alias 인식 실패: TS Server 재시작, Vite 재실행

## 8. API 경로 설정

- 프런트 API 기본 경로는 `VITE_API_BASE_URL` 입니다.
- 값이 없으면 기본값으로 `/api` 를 사용합니다.
- 로컬 개발에서는 `vite.config.ts` 의 `/api` 프록시가 `http://localhost:8080` 으로 전달합니다.
- 배포 환경에서는 인프라 문서 기준으로 ingress/nginx 라우팅에 맞는 값을 설정합니다.

예시:

```bash
VITE_API_BASE_URL=/api
```

또는 API를 절대 URL로 직접 지정해야 하면:

```bash
VITE_API_BASE_URL=https://ssafymaker.cloud/api
```
