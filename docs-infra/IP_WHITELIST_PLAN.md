# IP Whitelist Plan

## 목적
운영 도구를 외부 HTTPS 도메인으로 공개하되, 서비스 자체 로그인 외에 공통 IP 화이트리스트를 추가 방어선으로 적용한다.

SSH 터널링 위주 운영 대신 다음 구조로 정리한다.

- HTTPS
- 서비스 자체 로그인
- 공통 IP 화이트리스트
- Google Form + Google Sheet + n8n 자동 반영
- Mattermost 알림

## 화이트리스트 대상

### 전체 도메인 대상
- `jenkins.ssafymaker.cloud`
- `n8n.ssafymaker.cloud`
- `grafana.ssafymaker.cloud`
- `rabbitmq.ssafymaker.cloud`

### 부분 경로 대상
- `auth.ssafymaker.cloud` 의 Keycloak admin 관련 경로만 제한
- `auth.ssafymaker.cloud` 전체 도메인은 화이트리스트 대상이 아님

## 배경
현재 Keycloak은 다음 구조로 사용한다.

- 브라우저 공개 URL: `https://auth.ssafymaker.cloud`
- 백엔드 내부 통신 URL: `http://stg-keycloak:8080`
- JWT issuer: `https://auth.ssafymaker.cloud/realms/app`

즉 `auth.ssafymaker.cloud` 전체를 화이트리스트로 막으면 일반 로그인 흐름이 깨질 수 있으므로 admin 관련 경로만 제한한다.

## 공통 화이트리스트 정책
운영 도구별로 서로 다른 allowlist를 두지 않고, 공통 whitelist 1개를 적용한다.

즉 허용된 개발자는 아래 운영 도구에 공통 접근 가능하게 한다.

- Jenkins
- n8n
- Grafana
- RabbitMQ Management UI
- Keycloak Admin 관련 경로

## 신청 방식
Google Form으로 신청을 받고, Google Sheet와 n8n으로 자동 반영한다.

### Google Form 문항
- 이름
- 허용할 공인 IP
- 회사 CIDR망주소(선택)
- 비고(선택)

### Form 운영 원칙
- 조직 계정 사용자만 제출 가능
- 이메일 자동 수집
- 일반 개발자는 공인 IP만 제출하는 것이 기본
- 회사 고정망이 필요한 경우에만 CIDR 제출

## 입력 검증 정책

### 허용
- 공인 IP
- 회사 CIDR

### 거절
- 사설 IP
- 잘못된 형식의 IP
- 잘못된 CIDR

### 중복 처리
- 중복 신청은 오류로 처리하지 않음
- 최종 whitelist 산출물에서 dedupe 처리
- 사용자에게 별도 오류를 알리지 않고 조용히 성공 처리

### 만료 정책
- 이번 프로젝트는 개발 기간이 짧으므로 만료 정책을 두지 않음
- 프로젝트 종료 시 일괄 정리 예정

## 알림 정책
알림은 이메일이 아니라 Mattermost 전용 채널로 보낸다.

### Mattermost 채널 용도
- 검증 실패
- 반영 실패
- 재시도 실패
- 운영자 확인 필요 상황

### 알림 세부 정책
- 검증 실패: Mattermost 알림 + 시트 기록
- 잘못된 CIDR: 거절 후 시트 기록 + Mattermost 알림
- 사설 IP 입력: 자동 거절 후 시트 기록 + Mattermost 알림
- 중복 처리: 무시하고 조용히 성공 처리
- Nginx 파일 생성 실패: 현재 반영 유지, 1회 재시도 후 Mattermost 알림
- `nginx reload` 실패: 1회 재시도 후 실패 시 Mattermost 알림
- Google Sheet 읽기 실패: 1회 재시도 후 실패 시 Mattermost 알림

## Nginx 반영 구조
실제 화이트리스트 반영은 Cloudflare가 아니라 Nginx 기준으로 처리한다.

이유:
- 현재 `ingress-nginx-1` 중심 reverse proxy 구조
- n8n 자동화와 디버깅이 단순함
- 공통 whitelist 파일 1개를 여러 server/location 에 include 하기 적합함

## 런타임 디렉터리
화이트리스트 반영용 동적 파일은 git 저장소 안이 아니라 서버 런타임 디렉터리에서 관리한다.

운영 경로:
- `/home/ubuntu/deploy/nginx/whitelist`

컨테이너 마운트 경로:
- `/etc/nginx/whitelist`

## 런타임 파일 구조
- `/home/ubuntu/deploy/nginx/whitelist/active-whitelist.conf`
- `/home/ubuntu/deploy/nginx/whitelist/backup-whitelist.conf`
- `/home/ubuntu/deploy/nginx/whitelist/candidate-whitelist.conf`

## 반영/롤백 흐름
1. n8n이 `candidate-whitelist.conf` 생성
2. 현재 `active-whitelist.conf` 를 `backup-whitelist.conf` 로 보관
3. `candidate-whitelist.conf` 를 `active-whitelist.conf` 로 교체
4. `nginx -t` 실행
5. 성공 시 `nginx reload`
6. 실패 시 `backup-whitelist.conf` 를 `active-whitelist.conf` 로 복원하고 Mattermost 알림

## 반영 시 주의사항
- “직전 파일”이 아니라 “직전 정상본” 개념으로 관리
- 반쯤 작성된 파일을 nginx가 읽지 않도록 임시 파일 작성 후 원자적 교체 필요
- 동시 실행/경합 방지 필요
- whitelist 디렉터리는 컨테이너에 read-only 로 마운트
- nginx 정적 설정은 저장소에서 관리하고, 동적 whitelist 결과물은 런타임 디렉터리에서 관리

## Nginx 적용 위치
### 전체 도메인 화이트리스트
- `jenkins.ssafymaker.cloud`
- `n8n.ssafymaker.cloud`
- `grafana.ssafymaker.cloud`
- `rabbitmq.ssafymaker.cloud`

### 부분 경로 화이트리스트
- `auth.ssafymaker.cloud` 의 `/admin` 계열 경로

## RabbitMQ 주의사항
RabbitMQ는 관리 UI만 외부 공개한다.

- 외부 공개 대상: `15672`
- 외부 비공개 유지: `5672`

즉 `rabbitmq.ssafymaker.cloud` 는 관리 UI 프록시 전용으로 사용한다.

## Grafana 주의사항
Grafana는 외부 공개 도메인 추가 전 ingress
