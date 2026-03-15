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
   - `/home/ubuntu/deploy/frontend/live:/usr/share/nginx/frontend:ro`
- `live` 구조 정상 확인
- origin / Cloudflare 이미지 응답 정상 확인

### 백엔드
- green / blue 컨테이너 공존
- health check / switch / rollback 계속 보완 필요

### 운영 도구
- Jenkins / n8n / Grafana / Prometheus 정상 기동

## 5. 현재 남은 작업
1. 백엔드 health check 단계 안정화
2. merge 완료 이벤트 기준으로 CI/CD 정책 정리
3. 문서 재배치 완료
4. TIL 정리
5. n8n 자동화 이후 PROD 기준 observability(node_exporter, cAdvisor, Grafana, nginx access log) 작업 진행
   - 세부 범위와 순서는 `docs-infra/OBSERVABILITY_PLAN.md` 참고

## 6. 의사결정 메모
- 루트에는 안내 문서만 둔다
- 상세 운영 문서는 `docs-infra/` 에 모은다
- 인프라 값은 실제 주소/경로/프로젝트명/credential id 기준으로 쓴다
- 프론트 정적 파일은 `live + rsync` 구조를 유지한다
- Cloudflare purge는 `prefixes` 중심으로 유지한다