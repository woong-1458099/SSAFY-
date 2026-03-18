# 운영 명령

이 문서는 운영 중 자주 쓰는 서버 점검 명령을 모아둔 문서다.

## 1. 서버 기본 정보
```bash
hostname
whoami
pwd
ip a
curl -4 ifconfig.me
```

## 2. 컨테이너/네트워크/볼륨 확인
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker ps --format '{{.Names}} {{.Label "com.docker.compose.project"}} {{.Label "com.docker.compose.service"}}'
docker network ls
docker volume ls
```

## 3. compose config 확인
```bash
docker compose --env-file docker/.env.ops -f docker/compose.ops.yml config
docker compose --env-file docker/.env.stg -f docker/compose.app.yml config
docker compose --env-file docker/.env.prod -f docker/compose.app.yml config
```

## 4. nginx 점검
```bash
sudo ls -al /home/ubuntu/deploy/nginx
sudo ls -al /home/ubuntu/deploy/nginx/whitelist
sudo cat /home/ubuntu/deploy/nginx/whitelist/active-whitelist.conf
docker exec ingress-nginx-1 nginx -t
docker exec ingress-nginx-1 nginx -s reload
docker logs --tail 200 ingress-nginx-1
```

## 5. Jenkins / n8n / 모니터링 로그
```bash
docker logs --tail 200 docker-jenkins-1
docker logs --tail 200 docker-n8n-1
docker logs --tail 200 docker-prometheus-1
docker logs --tail 200 docker-grafana-1
docker logs --tail 200 docker-loki-1
docker logs --tail 200 docker-promtail-1
```

## 6. 웹 엔드포인트 확인
```bash
curl -I https://jenkins.ssafymaker.cloud/
curl -I https://n8n.ssafymaker.cloud/
curl -i https://jenkins.ssafymaker.cloud/project/backend-develop-stg
curl -i https://n8n.ssafymaker.cloud/webhook-test/jenkins/deploy-notify
```

## 7. Prometheus / Grafana / RabbitMQ 확인
```bash
curl -s http://localhost:9090/-/healthy
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].labels.job'
curl -I http://localhost:3000/login
curl -I http://localhost:15672
```

## 8. env 파일 변수명만 확인
비밀값을 노출하지 않고 변수 목록만 볼 때 사용한다.

```bash
grep -v '^\s*$' docker/.env.local | cut -d= -f1 | sort
grep -v '^\s*$' docker/.env.stg | cut -d= -f1 | sort
grep -v '^\s*$' docker/.env.prod | cut -d= -f1 | sort
grep -v '^\s*$' docker/.env.ops | cut -d= -f1 | sort
grep -v '^\s*$' docker/.env.auth.stg | cut -d= -f1 | sort
```

## 9. compose 기동 기준
```bash
docker compose -p stg-app --env-file docker/.env.stg -f docker/compose.app.yml up -d
docker compose -p prod-app --env-file docker/.env.prod -f docker/compose.app.yml up -d
docker compose -p ingress -f docker/compose.nginx.yml up -d
docker compose -p docker --env-file docker/.env.ops -f docker/compose.ops.yml up -d
docker compose -p stg-auth --env-file docker/.env.auth.stg -f docker/compose.auth.yml up -d
```

## 10. 장애 확인 순서
1. Cloudflare DNS와 브라우저 응답 코드 확인
2. `docker ps` 로 컨테이너 상태 확인
3. nginx `nginx -t` 와 `docker logs` 확인
4. Jenkins 또는 n8n 로그 확인
5. Prometheus health 및 targets 확인
6. 필요한 경우 compose config로 실제 주입값 확인
