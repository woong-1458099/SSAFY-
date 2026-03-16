# R2_ASSET_DEPLOYMENT

## 목표

- `public/assets/game/**`를 Cloudflare R2에 업로드한다.
- 런타임에서는 R2 custom domain을 통해 정적 에셋을 직접 로드한다.
- 백엔드는 에셋 바이너리를 중계하지 않고, asset manifest와 base URL만 제공한다.

## 권장 R2 폴더 구조

```text
<bucket>/
  game/
    releases/
      2026-03-12.1/
        audio/
          BGM/
          SoundEffect/
        backgrounds/
        data/
          balance/
          localization/
          minigames/
          story/
        fonts/
        npc/
        ui/
```

## 로컬 소스 구조와 매핑

```text
FrontEnd/ssafy-maker/public/assets/game/**
-> R2: game/releases/<ASSET_VERSION>/**
```

예시:

```text
FrontEnd/ssafy-maker/public/assets/game/backgrounds/title_background.png
-> s3://<bucket>/game/releases/2026-03-12.1/backgrounds/title_background.png
```

## 백엔드 연동 방식

- 백엔드 `asset-manifest.json`은 상대 경로만 가진다.
- 백엔드 응답 `baseUrl`은 현재 배포된 에셋 릴리스 경로를 가리킨다.

예시:

```text
ASSET_BASE_URL=https://assets.ssafymaker.cloud/game/releases/2026-03-12.1
ASSET_MANIFEST_VERSION=2026-03-12.1
```

## 배포 순서

1. `public/assets/game` 내용을 최종 점검한다.
2. `ASSET_VERSION`을 새 릴리스 값으로 결정한다.
3. R2에 `game/releases/<ASSET_VERSION>/`로 업로드한다.
4. 업로드 검증 후 백엔드 `ASSET_BASE_URL`, `ASSET_MANIFEST_VERSION`을 새 버전으로 반영한다.
5. 프론트는 `/api/public/assets/manifest`를 읽어 새 에셋 버전을 사용한다.

## 필수 환경 변수

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `ASSET_VERSION`

선택:

- `R2_PUBLIC_BASE_URL`
  - 예: `https://assets.ssafymaker.cloud`

## 운영 원칙

- 기존 릴리스는 즉시 덮어쓰지 않는다.
- 새 버전은 항상 새 폴더에 올린다.
- 캐시 무효화는 버전 폴더 교체 방식으로 해결한다.
- 백엔드 base URL 전환 전까지는 기존 클라이언트가 이전 에셋을 계속 사용할 수 있어야 한다.

## AWS CLI / S3 호환 사용

Cloudflare R2는 S3 호환 API를 사용하므로 `aws s3 sync`로 업로드할 수 있다.

endpoint 형식:

```text
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 주의사항

- 공백과 특수문자가 포함된 파일명은 장기적으로 정리하는 편이 좋다.
  - 예: `convenience store.mp3`, `let's go.mp3`, `ssibal....mp3`
- 현재 초안 스크립트는 `public/assets/game` 전체를 동일 Cache-Control로 업로드한다.
- 필요하면 이미지/오디오/JSON별로 Cache-Control을 분리한 후속 스크립트로 발전시키면 된다.
