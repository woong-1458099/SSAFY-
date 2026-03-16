# 진행 현황 및 다음 계획

## 1. 현재 확정 아키텍처

### compose 분리 원칙
- 앱 스택: `docker/compose.app.yml`
- 데이터 스택: `docker/compose.data.local.yml`
- 운영 도구 스택: `docker/compose.ops.yml`

### env 분리 원칙
- `docker/.env.local`
- `docker/.env.stg`
- `docker/.env.prod`
- `docker/.env.ops`

## 2. 현재 운영 기준
- STG 서버: `13.125.26.13`
- 원격 프로젝트 경로: `/home/ubuntu/apps/S14P21E206`
- STG app compose project: `stg-app`
- STG data compose project: `stg-data`

## 3. 최근 완료
1. Jenkins / GitLab webhook 연동 정리
2. 프론트 자동 배포 구조 정리
3. Cloudflare purge 자동화 추가
4. 프론트 정적 파일 서빙 구조를 `live` 기반으로 전환
5. 백엔드 detect changes에 Jenkinsfile 변경 포함
6. 도메인 / reverse proxy / auth / keycloak 구조 정리

## 4. 현재 상태

### 프론트
- nginx mount:
    - `/home/ubuntu/deploy/frontend:/usr/share/nginx/frontend:ro`
- environment별 live 경로 사용
    - STG: `/usr/share/nginx/frontend/stg/live`
    - PROD: `/usr/share/nginx/frontend/prod/live`
- `live` 구조 정상 확인
- origin / Cloudflare 이미지 응답 정상 확인

### 백엔드
- green / blue 컨테이너 공존
- health check / switch / rollback 계속 보완 필요

### 운영 도구
- Jenkins / n8n / Grafana / Prometheus 정상 기동
- monitoring stack 기준으로 `node_exporter`, `cAdvisor`, `Loki`, `Promtail` 추가
- Grafana에서 Prometheus / Loki datasource를 함께 사용하는 구조로 정리

## 5. 현재 남은 작업
- observability 1차 설치 이후 검증 및 운영 정리 진행
    - Prometheus target 상태 점검
    - Grafana datasource 및 Explore 로그 조회 점검
    - 대시보드 정리
    - nginx / backend 로그 운영 기준 문서화
    - 필요 시 exporter / alerting 2차 확장 검토

## 6. 의사결정 메모
- 루트에는 안내 문서만 둔다
- 상세 운영 문서는 `docs-infra/` 에 모은다
- 인프라 값은 실제 주소/경로/프로젝트명/credential id 기준으로 쓴다
- 프론트 정적 파일은 `live + rsync` 구조를 유지한다
- Cloudflare purge는 `prefixes` 중심으로 유지한다