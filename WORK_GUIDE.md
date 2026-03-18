# 작업 안내

이 문서는 E206 인프라/배포/운영 작업의 시작점이다.

## 먼저 읽을 문서
1. `docs-infra/00_CURRENT_STATE.md`
2. `docs-infra/01_OPERATIONS.md`
3. 작업 주제에 맞는 세부 문서

## 문서 구조
- `docs-infra/00_CURRENT_STATE.md`
  - 현재 운영 실값
  - 서버, 도메인, 컨테이너, 네트워크, 노출 상태
- `docs-infra/01_OPERATIONS.md`
  - 서버 점검 명령
  - 로그, 헬스체크, nginx/Jenkins/n8n 운영 명령
- `docs-infra/02_CI_CD.md`
  - GitLab -> Jenkins -> n8n 흐름
  - webhook URL, trigger, credential 기준
- `docs-infra/03_ENV_VARS.md`
  - `.env.*` 파일 역할
  - 변수 카탈로그
- `docs-infra/04_NETWORK_EDGE.md`
  - Cloudflare DNS
  - nginx ingress
  - whitelist 정책과 예외 경로
- `docs-infra/05_MONITORING.md`
  - Prometheus, Grafana, Loki, Promtail
  - 현재 수집 상태와 다음 확장 대상
- `docs-infra/06_ROADMAP.md`
  - 다음 작업
  - 공개 예정 도메인/페이지 계획

## 유지 원칙
- 현재 실제 운영값은 `docs-infra/00_CURRENT_STATE.md` 한 곳에만 적는다.
- 비밀값은 문서에 직접 적지 않는다.
- 비밀값은 변수명, 사용 위치, 저장 위치만 적는다.
- 인프라 값은 추상적으로 쓰지 말고 실제 주소, 경로, 프로젝트명, 컨테이너명 기준으로 적는다.
- 운영 변경이 있으면 관련 문서를 함께 갱신한다.
