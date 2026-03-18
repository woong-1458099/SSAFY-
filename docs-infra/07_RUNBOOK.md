# 배포 런북

이 문서는 실제 배포와 장애 대응 시 바로 따라갈 수 있는 실행 절차를 정리한다.

## 1. 공통 전제
- Jenkins job은 GitLab webhook 또는 수동 실행으로 시작된다.
- frontend와 backend는 STG/PROD가 분리되어 있다.
- backend는 blue/green 기준으로 운영한다.
- frontend는 environment별 `live` 디렉터리를 사용한다.
- nginx는 공용 ingress 컨테이너 `ingress-nginx-1` 기준으로 운영한다.

## 2. frontend STG 배포 순서
대상 job:
- `frontend-develop-stg`

핵심 흐름:
1. SCM checkout
2. branch/path guard 확인
3. frontend build
4. release 디렉터리 생성 및 파일 배치
5. `live` 디렉터리 반영
6. nginx config test
7. nginx reload
8. smoke check
9. Cloudflare purge
10. 성공/실패 결과를 n8n webhook으로 알림

### frontend STG 경로
- release root: `/home/ubuntu/deploy/frontend/stg/releases`
- live root: `/home/ubuntu/deploy/frontend/stg/live`

### frontend STG smoke check 기준
- nginx 컨테이너 내부에서 `Host` 헤더를 붙여 확인한다.
- 기준 도메인: `stg.ssafymaker.cloud`
- 요청이 정상적으로 반환되고 정적 파일이 비어 있지 않으면 통과로 본다.

### frontend STG rollback 기준
- `live` 반영 이후 실패하면 이전 `live` 디렉터리 기준으로 복원한다.
- 복원 후 nginx `-t`, reload 를 다시 수행한다.

## 3. frontend PROD 배포 순서
대상 job:
- `frontend-master-prod`

핵심 흐름:
1. SCM checkout
2. branch/path guard 확인
3. frontend build
4. release 디렉터리 생성 및 파일 배치
5. `live` 디렉터리 반영
6. nginx config test
7. nginx reload
8. smoke check
9. Cloudflare purge
10. 성공/실패 결과를 n8n webhook으로 알림

### frontend PROD 경로
- release root: `/home/ubuntu/deploy/frontend/prod/releases`
- live root: `/home/ubuntu/deploy/frontend/prod/live`

### frontend PROD smoke check 기준
- nginx 컨테이너 내부에서 `Host` 헤더를 붙여 확인한다.
- 기준 도메인: `ssafymaker.cloud`
- 요청이 정상적으로 반환되고 정적 파일이 비어 있지 않으면 통과로 본다.

## 4. backend STG 배포 순서
대상 job:
- `backend-develop-stg`

핵심 흐름:
1. SCM checkout
2. branch/path guard 확인
3. test / build
4. docker image build
5. target color 결정
6. target color 컨테이너 배포
7. target color health check
8. nginx upstream 전환
9. verify
10. 실패 시 rollback
11. 성공/실패 결과를 n8n webhook으로 알림

### backend STG 운영 파일
- nginx upstream file: `/home/ubuntu/deploy/nginx/upstreams/active-stg.conf`
- nginx container: `ingress-nginx-1`

### backend STG health check 기준
- EC2 내부 또는 nginx/container 네트워크 안에서 확인한다.
- endpoint는 Spring actuator health 기준이다.
- 응답 JSON에 `"status":"UP"` 가 포함되어야 통과로 본다.

### backend STG verify 기준
- upstream 전환 후 target color 기준으로 다시 health 확인
- 실패하면 현재 active color 로 rollback

### backend STG rollback 기준
- rollback 시 `active-stg.conf` 를 이전 active color 기준으로 다시 작성
- 이후 nginx reload 재실행

## 5. backend PROD 배포 순서
대상 job:
- `backend-master-prod`

핵심 흐름:
1. SCM checkout
2. branch/path guard 확인
3. test / build
4. docker image build
5. target color 결정
6. target color 컨테이너 배포
7. target color health check
8. nginx upstream 전환
9. verify
10. 실패 시 rollback
11. 성공/실패 결과를 n8n webhook으로 알림

### backend PROD 운영 파일
- nginx upstream file: `/home/ubuntu/deploy/nginx/upstreams/active-prod.conf`
- nginx container: `ingress-nginx-1`

### backend PROD health check 기준
- EC2 내부 또는 nginx/container 네트워크 안에서 확인한다.
- 응답 JSON에 `"status":"UP"` 가 포함되어야 통과로 본다.

## 6. Cloudflare purge 기준
frontend 배포 후에는 Cloudflare purge 를 수행한다.

운영 원칙:
- frontend만 purge 대상이다.
- backend 배포는 Cloudflare purge 대상이 아니다.
- purge 는 Jenkins credential:
  - `cloudflare-api-token`
  - `cloudflare-zone-id`
  기준으로 수행한다.

문서화 시 실제 purge prefix 는 Jenkinsfile과 Cloudflare 정책이 바뀔 수 있으므로, 실행 직전 Jenkinsfile 기준을 우선 확인한다.

## 7. verify / rollback 운영 원칙
- backend verify / rollback 은 ssh heredoc 방식 기준으로 유지한다.
- Jenkins 로컬 shell 평가와 원격 shell 평가를 섞지 않는다.
- upstream 전환 전 active color 를 기록하고, verify 실패 시 그 색상으로 복원한다.
- frontend rollback 은 이전 live 디렉터리 복원 기준으로 유지한다.

## 8. 장애 대응 순서
### Jenkins webhook이 안 붙을 때
1. GitLab webhook 테스트 결과 확인
2. Jenkins `/project/...` 응답 코드 확인
3. nginx whitelist 예외(`/project/`) 상태 확인
4. Jenkins trigger 설정과 webhook secret 확인

### n8n deploy notify가 안 붙을 때
1. Jenkins post 단계 curl 결과 확인
2. n8n Header Auth 설정 확인
3. `https://n8n.ssafymaker.cloud/webhook/jenkins/deploy-notify` 경로 확인
4. n8n workflow active 상태 확인

### frontend 장애 시
1. 현재 live 디렉터리 내용 확인
2. nginx `-t` 확인
3. nginx reload 가능 여부 확인
4. 이전 release 또는 이전 live 기준 복원

### backend 장애 시
1. target color health 확인
2. 현재 active upstream 확인
3. verify 실패 시 이전 active color 로 rollback
4. rollback 후 health 재확인

## 9. 체크 명령
```bash
docker exec ingress-nginx-1 nginx -t
docker exec ingress-nginx-1 nginx -s reload
docker logs --tail 200 ingress-nginx-1
docker logs --tail 200 docker-jenkins-1
docker logs --tail 200 docker-n8n-1
curl -i https://jenkins.ssafymaker.cloud/project/backend-develop-stg
curl -i https://n8n.ssafymaker.cloud/webhook-test/jenkins/deploy-notify
```
