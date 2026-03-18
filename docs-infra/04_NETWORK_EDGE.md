# 네트워크와 외부 노출

이 문서는 Cloudflare, nginx ingress, whitelist 정책, 외부 노출 기준을 정리한다.

## 1. 경계 구조
1. Cloudflare
2. EC2 공인 IP `13.125.26.13`
3. `ingress-nginx-1`
4. 내부 Docker 서비스

## 2. 현재 외부 공개 도메인
- `ssafymaker.cloud`
- `www.ssafymaker.cloud`
- `stg.ssafymaker.cloud`
- `auth.ssafymaker.cloud`
- `jenkins.ssafymaker.cloud`
- `n8n.ssafymaker.cloud`

## 3. 추가 예정 도메인
- `grafana.ssafymaker.cloud`
- `prometheus.ssafymaker.cloud`
- `rabbitmq.ssafymaker.cloud`
- `dev.ssafymaker.cloud`

## 4. whitelist 정책
운영 도구는 기본적으로 공통 whitelist 파일을 include 해서 보호한다.

### whitelist 런타임 경로
- 호스트: `/home/ubuntu/deploy/nginx/whitelist`
- 컨테이너: `/etc/nginx/whitelist`

### 운영 파일
- `active-whitelist.conf`
- `backup-whitelist.conf`
- `candidate-whitelist.conf`

### 현재 allow 값
- `112.158.208.25`
- `59.20.195.127`

## 5. 예외 경로
### Jenkins
- 예외: `/project/`
- 목적: GitLab webhook 수신
- 유지: `/` 이하 Jenkins UI는 whitelist 적용

### n8n
- 예외: `/webhook/`
- 예외: `/webhook-test/`
- 목적: 외부 webhook 수신
- 유지: `/` 이하 n8n UI는 whitelist 적용

### auth
- `/admin` 및 `/admin/` 만 whitelist 적용
- 일반 auth 플로우는 서비스 접근 기준 유지

## 6. 보안 해석
- Jenkins 전체를 열지 않고, `/project/*` 만 예외 처리한다.
- n8n 전체를 열지 않고, webhook 수신 경로만 예외 처리한다.
- GitLab webhook secret, Jenkins job별 secret, n8n Header Auth를 함께 사용한다.
- whitelist만으로 끝내지 않고 endpoint 목적별 인증을 같이 둔다.

## 7. 앞으로의 공개 기준
### Grafana
- 새 도메인 추가 예정
- whitelist 적용 유지
- 운영자 로그인 전제

### Prometheus
- 새 도메인 추가 예정
- whitelist 적용 유지
- 운영자 점검용 read-only 성격

### RabbitMQ
- 새 도메인 추가 예정
- management UI만 외부 공개
- AMQP 포트는 외부 비공개 유지
- whitelist 적용 유지

### dev 링크 페이지
- `dev.ssafymaker.cloud` 예정
- 운영 도구 링크 허브 용도
- whitelist 적용 예정

## 8. dev 링크 페이지 구현 선택
### 정적 페이지
장점:
- nginx만으로 운영 가능
- 빌드/배포 복잡도 낮음
- 링크 허브 용도로 충분

단점:
- 상태 배지, 동적 정보, 인증 연동 확장성 낮음

### 프론트 앱
장점:
- 확장성 높음
- 운영 상태/배포 상태/링크 그룹화에 유리

단점:
- 빌드 파이프라인 추가 필요
- 링크 허브 용도에는 과할 수 있음

### 현재 추천
- 1차 구현은 정적 페이지
- 향후 운영 허브로 확장할 때 프론트 앱 전환 검토
