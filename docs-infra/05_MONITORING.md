# 모니터링 상태

이 문서는 Prometheus, Grafana, Loki, Promtail 중심의 현재 모니터링 구성을 정리한다.

## 1. 현재 스택
- Prometheus
- Grafana
- Loki
- Promtail
- node-exporter
- docker-stats-exporter

## 2. 현재 컨테이너
- `docker-prometheus-1`
- `docker-grafana-1`
- `docker-loki-1`
- `docker-promtail-1`
- `docker-node-exporter-1`
- `docker-docker-stats-exporter-1`

## 3. 현재 확인된 상태
- Prometheus health: 정상
- Grafana login 페이지 응답: 정상
- Prometheus active targets:
  - `docker-stats-exporter`
  - `node-exporter`
  - `prometheus`

## 4. 현재 데이터 흐름
- 메트릭:
  - node-exporter -> Prometheus
  - docker-stats-exporter -> Prometheus
- 로그:
  - Docker stdout/stderr -> Promtail -> Loki -> Grafana

## 5. 설정 파일
- Prometheus config: `Infra/monitoring/prometheus.yml`
- Loki config: `Infra/monitoring/loki-config.yml`
- Promtail config: `Infra/monitoring/promtail-config.yml`
- Grafana provisioning:
  - `Infra/monitoring/grafana/provisioning`

## 6. 공개 계획
도메인 추가 예정:
- `grafana.ssafymaker.cloud`
- `prometheus.ssafymaker.cloud`

운영 정책:
- 둘 다 whitelist 적용
- 운영자 접근 기준으로만 공개

## 7. 아직 붙지 않은 항목
- RabbitMQ exporter
- Jenkins exporter 또는 대체 메트릭 수집
- n8n exporter 또는 대체 메트릭 수집
- nginx exporter
- Grafana 자체 외부 도메인 연결
- Prometheus 외부 도메인 연결

## 8. RabbitMQ 관찰 기준
현재 RabbitMQ는 management UI만 외부 공개 예정이다.

운영 방침:
- management UI는 whitelist + 로그인
- AMQP 포트는 외부 미공개 유지
- 향후 exporter 추가 시 Prometheus scrape 대상에만 붙인다

## 9. 점검 명령
```bash
curl -s http://localhost:9090/-/healthy
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].labels.job'
curl -I http://localhost:3000/login
curl -I http://localhost:15672
docker logs --tail 200 docker-prometheus-1
docker logs --tail 200 docker-grafana-1
docker logs --tail 200 docker-loki-1
docker logs --tail 200 docker-promtail-1
```
