# 다음 작업

이 문서는 현재 인프라 기준의 다음 우선순위 작업을 정리한다.

## 1. 외부 도메인 추가
- `grafana.ssafymaker.cloud`
- `prometheus.ssafymaker.cloud`
- `rabbitmq.ssafymaker.cloud`
- `dev.ssafymaker.cloud`

모두 Cloudflare 레코드 추가 후 nginx ingress에 라우팅을 연결한다.

## 2. 운영 도구 공개 정책 유지
- Grafana: whitelist 유지
- Prometheus: whitelist 유지
- RabbitMQ management UI만 공개
- Jenkins UI는 whitelist 유지
- n8n UI는 whitelist 유지

## 3. CI/CD 안정화
- Jenkins `/project/` webhook 동작 최종 검증
- GitLab webhook 테스트 결과와 실제 merge 이벤트 결과 정리
- Jenkins 404 응답 원인 추가 확인

## 4. 모니터링 확장
- RabbitMQ exporter 추가
- Jenkins/n8n/nginx 메트릭 수집 방법 결정
- Prometheus scrape 대상 확장
- Grafana 대시보드 추가

## 5. dev 링크 페이지
목적:
- 운영자용 링크 허브
- Jenkins, n8n, Grafana, RabbitMQ, Prometheus, auth, main, stg 링크 제공

권장 1차 구현:
- 정적 페이지

추후 확장:
- 프론트 앱 기반 운영 허브

## 6. 문서 유지 규칙
- 운영 실값은 `00_CURRENT_STATE.md` 에만 갱신
- 주제별 정책은 각 문서에만 갱신
- 비밀값은 문서에 직접 쓰지 않음
