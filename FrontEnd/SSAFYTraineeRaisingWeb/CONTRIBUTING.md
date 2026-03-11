# Contributing

팀 공통 규칙은 아래 문서를 기준으로 합니다.

- `docs/conventions/RULES.md`
- `docs/conventions/BRANCH_STRATEGY.md`
- `docs/conventions/FOLDER_OWNERSHIP.md`
- `docs/conventions/ASSET_PIPELINE.md`

## 기본 흐름

1. 작업 브랜치 생성 (`feat/...`, `fix/...`, `chore/...`)
2. 담당 폴더 중심으로 작업
3. 빌드 확인 (`npm run build`)
4. PR 생성 (템플릿 제목 규칙 준수)

## 금지 사항

- 타 feature 내부 파일을 직접 수정
- `assets/raw`를 런타임에서 직접 로드
- 씬 등록 파일 외부에서 씬 배열 임의 수정