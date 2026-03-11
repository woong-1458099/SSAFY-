# CI/CD Runbook

## 1. 목적
이 문서는 현재 E206 프로젝트의 Jenkins / GitLab / Cloudflare 기반 CI/CD 운영 기준을 정리한다.

## 2. Jenkins Job 목록
- `frontend-develop-mr-ci-dev-deploy`
  - 프론트 STG 배포
  - Script Path: `jenkins/Jenkinsfile.frontend-develop-mr-ci-dev-deploy`
- `develop-mr-ci-dev-deploy`
  - 백엔드 STG 배포
  - Script Path: `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`
- `master-merge-cd`
  - 운영 배포
  - Script Path: `jenkins/Jenkinsfile.master-merge-cd`
- `nightly-deploy`
  - 예약 배포
  - Script Path: `jenkins/Jenkinsfile.nightly-deploy`

## 3. GitLab / Jenkins 연결 기준
### GitLab Connection
- Connection name: `E206`
- GitLab host URL: `https://lab.ssafy.com`

### Jenkins URL
- 외부 접근 주소 기준으로 설정한다.
- `localhost` 사용 금지

## 4. 현재 운영 이벤트 기준
기본 방향은 `merge 완료 후 처리` 중심으로 가져간다.

권장:
- `Accepted Merge Request Events`

필요 시 수동 검증:
- `SKIP_PATH_FILTER=true`

## 5. 프론트 파이프라인 기준

### Jenkinsfile
- `jenkins/Jenkinsfile.frontend-develop-mr-ci-dev-deploy`

### 현재 핵심 값
- `FRONTEND_LIVE_DIR=/home/ubuntu/deploy/frontend/live`
- `FRONTEND_RELEASES_DIR=/home/ubuntu/deploy/frontend/releases`
- `NGINX_CONTAINER=stg-app-nginx-1`

### 현재 반영 확인된 줄
- line 25:
  - `FRONTEND_LIVE_DIR = '/home/ubuntu/deploy/frontend/live'`
- line 119~120:
  - `mkdir -p $FRONTEND_LIVE_DIR`
  - `rsync -a --delete $FRONTEND_RELEASES_DIR/$RELEASE_TAG/ $FRONTEND_LIVE_DIR/`
- line 167:
  - `stage('Purge Cloudflare Cache')`
- line 170:
  - `string(credentialsId: 'cloudflare-api-token', variable: 'CF_API_TOKEN')`
- line 198~199:
  - rollback 시 `rsync -a --delete $PREV_CURRENT_TARGET/ $FRONTEND_LIVE_DIR/`

### 프론트 배포 흐름
1. checkout
2. detect changes
3. resolve release tag
4. frontend ci
5. upload release to EC2
6. sync release to live
7. nginx config test / reload
8. health/smoke check
9. Cloudflare purge

### 프론트 path filter 기준
- `FrontEnd/ssafy-maker/**`
- `jenkins/Jenkinsfile.frontend-develop-mr-ci-dev-deploy`

### Cloudflare purge
Jenkins Credentials:
- `cloudflare-api-token`
- `cloudflare-zone-id`

현재 purge 방식:
- `prefixes`
- `ssafymaker.cloud/assets/game/`
- `ssafymaker.cloud/assets/`

## 6. 백엔드 파이프라인 기준

### Jenkinsfile
- `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`

### 현재 확인된 detect changes 관련 줄
- line 11:
  - `SKIP_PATH_FILTER`
- line 37:
  - `stage('Detect Changes')`
- line 40~41:
  - `SKIP_PATH_FILTER=true -> backend path filter skipped`
- line 56~58:
  - `backendChanged` 조건 안에 `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy` 포함
- line 69:
  - `if (!backendChanged)`

### 백엔드 path filter 기준
- `BackEnd/**`
- `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`

### 백엔드 STG 기준 값
- STG 서버: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- compose args:
  - `-p stg-app --env-file docker/.env.stg -f docker/compose.app.yml`
- nginx 컨테이너:
  - `stg-app-nginx-1`

### 백엔드 현재 컨테이너
- `stg-app-api-green-1`
- `stg-app-api-blue-1`

현재 이미지 상태:
- `stg-app-api-green-1 -> s14p21e206-backend:d4bf9b6a61be`
- `stg-app-api-blue-1 -> 6accf561d7af`

## 7. Jenkins Credentials 기준
- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`

## 8. 현재 운영 도메인
- 메인 서비스: `ssafymaker.cloud`
- Jenkins: `jenkins.ssafymaker.cloud`
- n8n: `n8n.ssafymaker.cloud`
- auth: `auth.ssafymaker.cloud`
- 운영자 점검용: `j14e206.p.ssafy.io`

## 9. 장애 대응 메모

### 프론트
- 정적 에셋 경로는 `public/assets/game` 기준으로 관리
- Cloudflare가 예전 fallback HTML을 캐시할 수 있으므로 배포 후 purge 필요
- `current` symlink mount 방식은 사용하지 않는다
- `live` 고정 디렉터리 + rsync 구조 사용

### 백엔드
- health check는 반드시 EC2 내부 실행
- JSON `"status":"UP"` 기준 판정
- `TARGET_COLOR` 전달 여부 확인

## 10. 다음 작업
1. 백엔드 health check / switch / rollback 절차 안정화
2. merge 완료 기준 운영 정책 고정
3. 문서 최신화 유지