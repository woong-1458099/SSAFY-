# Monitoring Config

## 구성 요소
- `prometheus.yml`
- `loki-config.yml`
- `promtail-config.yml`
- `grafana/provisioning/datasources/monitoring.yml`

## 역할
- `node_exporter`
    - EC2 호스트 메트릭 수집
- `cAdvisor`
    - Docker 컨테이너 메트릭 수집
- `Loki`
    - 로그 저장 / 검색
- `Promtail`
    - Docker 컨테이너 로그를 Loki로 전달
- `Prometheus`
    - 메트릭 scrape / 저장
- `Grafana`
    - 메트릭 / 로그 UI

## 기본 확인 포인트
1. Prometheus Targets 에서 `node-exporter`, `cadvisor` 가 `UP`인지 확인
2. Grafana datasource 에서 `Prometheus`, `Loki` 확인
3. Grafana Explore 에서 `{job="docker"}` 로그 조회 확인