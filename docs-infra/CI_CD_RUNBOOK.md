# CI/CD Runbook

## 1. 목적
이 문서는 E206 프로젝트의 Jenkins / GitLab / Cloudflare 기반 CI/CD 운영 기준을 정리한다.

## 2. Jenkins Job 목록

### STG
- `backend-develop-stg`
  - develop 브랜치 기준 STG 백엔드 CI/CD
  - Script Path: `jenkins/Jenkinsfile.backend-develop-stg`

- `frontend-develop-stg`
  - develop 브랜치 기준 STG 프론트엔드 CI/CD
  - Script Path: `jenkins/Jenkinsfile.frontend-develop-stg`

### PROD
- `backend-master-prod`
  - master 브랜치 기준 PROD 백엔드 CI/CD
  - Script Path: `jenkins/Jenkinsfile.backend-master-prod`

- `frontend-master-prod`
  - master 브랜치 기준 PROD 프론트엔드 CI/CD
  - Script Path: `jenkins/Jenkinsfile.frontend-master-prod`

### 기타
- `nightly-deploy`
  - 예약 배포 / 실험용
  - Script Path: `jenkins/Jenkinsfile.nightly-deploy`

## 3. GitLab / Jenkins 연결 기준

### GitLab Connection
- Connection name: `E206`
- GitLab host URL: `https://lab.ssafy.com`

### Jenkins URL
- 외부 접근 주소 기준으로 설정
- `localhost` 사용 금지

### Webhook URL 목록
- `https://jenkins.ssafymaker.cloud/project/backend-develop-stg`
- `https://jenkins.ssafymaker.cloud/project/frontend-develop-stg`
- `https://jenkins.ssafymaker.cloud/project/backend-master-prod`
- `https://jenkins.ssafymaker.cloud/project/frontend-master-prod`

### Webhook 이벤트
- `Merge request events`
- `SSL Verification: enabled`

## 4. 브랜치 / 환경 기준
- `develop` -> STG
- `master` -> PROD

각 Jenkinsfile은 아래 두 기준으로 동작한다.
1. 대상 브랜치 가드
2. path filter

즉 관련 없는 MR 이벤트가 들어와도 branch guard 또는 path filter에서 `NOT_BUILT`로 종료된다.

## 5. STG 프론트 파이프라인 기준

### Jenkinsfile
- `jenkins/Jenkinsfile.frontend-develop-stg`

### 핵심 값
- `FRONTEND_RELEASES_DIR=/home/ubuntu/deploy/frontend/stg/releases`
- `FRONTEND_LIVE_DIR=/home/ubuntu/deploy/frontend/stg/live`
- `NGINX_CONTAINER=ingress-nginx-1`
- `FRONTEND_DOMAIN=stg.ssafymaker.cloud`

### path filter 기준
- `FrontEnd/ssafy-maker/**`
- `jenkins/Jenkinsfile.frontend-develop-stg`

### 배포 흐름
1. checkout
2. validate target branch
3. detect changes
4. resolve release tag
5. frontend ci
6. upload release to EC2
7. sync release to live
8. nginx config test / reload
9. health / smoke check
10. Cloudflare purge

### smoke check 기준
- root: `200|301|302|304`
- api: `200|401`

### Cloudflare purge prefixes
- `stg.ssafymaker.cloud/assets/game/`
- `stg.ssafymaker.cloud/assets/`

## 6. PROD 프론트 파이프라인 기준

### Jenkinsfile
- `jenkins/Jenkinsfile.frontend-master-prod`

### 핵심 값
- `FRONTEND_RELEASES_DIR=/home/ubuntu/deploy/frontend/prod/releases`
- `FRONTEND_LIVE_DIR=/home/ubuntu/deploy/frontend/prod/live`
- `NGINX_CONTAINER=ingress-nginx-1`
- `FRONTEND_DOMAIN=ssafymaker.cloud`

### path filter 기준
- `FrontEnd/ssafy-maker/**`
- `jenkins/Jenkinsfile.frontend-master-prod`

### Cloudflare purge prefixes
- `ssafymaker.cloud/assets/game/`
- `ssafymaker.cloud/assets/`

## 7. STG 백엔드 파이프라인 기준

### Jenkinsfile
- `jenkins/Jenkinsfile.backend-develop-stg`

### path filter 기준
- `BackEnd/**`
- `jenkins/Jenkinsfile.backend-develop-stg`

### 핵심 값
- STG 서버: `13.125.26.13`
- 원격 경로: `/home/ubuntu/apps/S14P21E206`
- compose args:
  - `-p stg-app --env-file docker/.env.stg -f docker/compose.app.yml`
- nginx container:
  - `ingress-nginx-1`
- upstream file:
  - `/home/ubuntu/deploy/nginx/upstreams/active-stg.conf`

### blue-green 대상
- `stg-api-blue`
- `stg-api-green`

### 배포 흐름
1. checkout
2. validate target branch
3. detect changes
4. resolve image tag
5. test
6. build jar
7. build docker image on EC2
8. detect active color
9. deploy target color
10. health check
11. switch nginx upstream
12. verify and rollback

## 8. PROD 백엔드 파이프라인 기준

### Jenkinsfile
- `jenkins/Jenkinsfile.backend-master-prod`

### path filter 기준
- `BackEnd/**`
- `jenkins/Jenkinsfile.backend-master-prod`

### 핵심 값
- PROD 서버: `13.125.26.13`
- 원격 경로: `/home/ubuntu/apps/S14P21E206`
- compose args:
  - `-p prod-app --env-file docker/.env.prod -f docker/compose.app.yml`
- nginx container:
  - `ingress-nginx-1`
- upstream file:
  - `/home/ubuntu/deploy/nginx/upstreams/active-prod.conf`

### blue-green 대상
- `prod-api-blue`
- `prod-api-green`

## 9. Jenkins Credentials 기준
- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`

## 10. 현재 운영 도메인
- PROD: `ssafymaker.cloud`
- STG: `stg.ssafymaker.cloud`
- Jenkins: `jenkins.ssafymaker.cloud`
- n8n: `n8n.ssafymaker.cloud`
- auth: `auth.ssafymaker.cloud`
- 운영자 점검용: `j14e206.p.ssafy.io`

## 11. 장애 대응 메모

### 프론트
- 정적 파일은 environment별 live 디렉터리를 사용
- symlink 기반 current mount는 사용하지 않음
- 배포 후 nginx reload + smoke check + Cloudflare purge 수행

### 백엔드
- health check는 반드시 EC2 내부에서 수행
- health check 기준은 JSON `"status":"UP"`
- nginx upstream 전환 후 verify / rollback 수행
- verify / rollback은 ssh heredoc 방식으로 실행하여 Jenkins 로컬 shell 평가 문제를 피함

## 12. 다음 작업
1. PROD 프론트 수동 검증 마무리
2. PROD 백엔드 수동 검증 마무리
3. 기존 구 job disable
4. 문서 최신화 유지