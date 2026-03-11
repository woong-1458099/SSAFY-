# 현재 진행 작업

## 현재 목적
CI/CD와 프론트 정적 파일 배포 구조를 실제 운영 상태 기준으로 정리하고, 문서를 재구성한다.

## 최근 완료 작업

### 프론트
- GitLab webhook -> Jenkins 프론트 잡 자동 실행 확인
- `jenkins/Jenkinsfile.frontend-develop-mr-ci-dev-deploy` 수정
- 정적 에셋을 `public/assets/game` 기준으로 관리하도록 정리
- Cloudflare cache purge 자동화 추가
- 프론트 정적 파일 서빙 구조를 `current` 심볼릭 링크 기반에서 `live` 고정 디렉터리 기반으로 전환
- `docker/compose.app.yml` 에서 프론트 nginx mount를 아래와 같이 변경
    - `/home/ubuntu/deploy/frontend/live:/usr/share/nginx/frontend:ro`

### 백엔드
- GitLab webhook -> Jenkins 백엔드 잡 자동 실행 확인
- `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy` 에 `SKIP_PATH_FILTER` 적용
- backend path filter에 자기 Jenkinsfile 변경도 포함
- commit SHA 기반 이미지 태그 전략 유지
- health check / switch / rollback은 계속 보완 중

### 인프라
- Jenkins / n8n / grafana / prometheus / keycloak / stg app/data 운영 상태 확인
- Jenkins URL, GitLab Connection, webhook 구조 점검
- Cloudflare와 nginx reverse proxy 경로 점검

## 현재 기준 실제 값

### 서버 / 경로
- STG 서버 IP: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`

### 프론트
- 프론트 소스 경로: `FrontEnd/ssafy-maker`
- 프론트 release 경로: `/home/ubuntu/deploy/frontend/releases`
- 프론트 live 경로: `/home/ubuntu/deploy/frontend/live`
- nginx mount:
    - `/home/ubuntu/deploy/frontend/live -> /usr/share/nginx/frontend`

### Jenkinsfile
- 프론트: `jenkins/Jenkinsfile.frontend-develop-mr-ci-dev-deploy`
- 백엔드: `jenkins/Jenkinsfile.develop-mr-ci-dev-deploy`
- 운영 배포: `jenkins/Jenkinsfile.master-merge-cd`
- 예약 배포: `jenkins/Jenkinsfile.nightly-deploy`

### Jenkins credentials
- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`

### compose project
- STG app: `stg-app`
- STG data: `stg-data`

## 지금 남은 작업
1. 프론트 Jenkinsfile 최종본을 문서에 반영
2. 백엔드 health check / switch / rollback 절차 정리
3. merge 완료 기준 CI/CD 정책 확정
4. n8n 자동화 이후 `OBSERVABILITY_PLAN.md` 기준으로 PROD 모니터링 최소 구성을 진행
  - 자세한 계획은 `docs-infra/OBSERVABILITY_PLAN.md` 참고

## 다음에 작업할 때 먼저 볼 것
1. `WORK_GUIDE.md`
2. `docs-infra/CURRENT_WORK.md`
3. `docs-infra/CI_CD_RUNBOOK.md`
4. 필요한 경우 `docs-infra/DOCKER_OVERVIEW.md`