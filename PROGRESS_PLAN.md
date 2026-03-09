# 진행 현황 및 다음 계획

## 1. 현재 확정 아키텍처

### 1) Compose 분리 원칙
- 앱 스택: `docker/compose.app.yml`
  - `nginx`, `api-blue`, `api-green`
- 데이터 스택(로컬/데이터 전용 서버): `docker/compose.data.local.yml`
  - `postgres`, `redis`, `rabbitmq`
- 운영 도구 스택: `docker/compose.ops.yml`
  - `jenkins`, `n8n`, `prometheus`, `grafana`

### 2) 환경변수 분리 원칙
- 로컬 개발자용: `docker/.env.local`
- 스테이징 앱 배포용: `docker/.env.stg`
- 운영 앱 배포용: `docker/.env.prod`
- 운영 도구용: `docker/.env.ops`

### 3) 볼륨 정책
- Jenkins: `jenkins_jenkins_home` (external 재사용)
- n8n: `n8n_n8n_data` (external 재사용)
- 데이터/모니터링 볼륨은 고정 이름 사용
- 주의: `docker compose down -v`, `docker volume prune`는 데이터 유실 가능

## 2. 지금까지 완료한 작업

1. compose 파일을 역할별로 분리하고 `docker/` 폴더로 정리
2. n8n encryption key 불일치 이슈 해결 및 재기동 검증
3. Jenkins/n8n 백업 파일 복원 절차 검증
4. 앱 이미지 빌드용 `BackEnd/Dockerfile` 추가
5. 문서(`DOCKER_ENV_YML.md`, `ENVIRONMENTS.md`) 정리 기반 마련

## 3. 운영 시 실행 기준

### 로컬 개발
- 로컬에서 data compose를 기본으로 띄우지 않음
- `docker/.env.local` + SSH 터널로 DB/Redis/RabbitMQ 연결

### 스테이징 앱
```bash
docker compose -p stg --env-file docker/.env.stg -f docker/compose.app.yml up -d
```

### 운영 앱
```bash
docker compose -p prod --env-file docker/.env.prod -f docker/compose.app.yml up -d
```

### 운영 도구
```bash
docker compose -p ops --env-file docker/.env.ops -f docker/compose.ops.yml up -d
```

## 4. 네트워크/보안 운영 원칙

1. 외부 공개 포트는 원칙적으로 Nginx(80/443)만 사용
2. 웹훅/콜백 인바운드도 Nginx를 통해 수신
3. DB/Redis/RabbitMQ는 외부 직접 공개 금지
4. SSH(22)는 필요 시에만 제한 개방
5. `stg/prod`는 같은 compose를 사용하되 `-p`로 프로젝트 분리

## 5. 접근 제어 자동화(확정)

1. Google Form 신청
2. Google Sheets 기록
3. n8n 자동 처리
4. Security Group에 `/32` 임시 등록
5. 만료 시간 도달 시 자동 회수

원칙:
- 초대된 계정만 신청 가능
- 공용 비밀번호 방식 사용 금지
- 신청/승인/회수 이력 기록

## 6. 다음 작업 계획

1. `api-blue/api-green` 실제 백엔드 이미지 태그 전략 확정
2. EC2 기준 보안그룹/포트 정책 확정
3. App EC2 / Data EC2 분리 시나리오 점검
4. 스테이징-운영 전환 체크리스트(롤백 포함) 문서화
5. 팀원용 SSH 터널 접속 가이드 표준화

## 7. 의사결정 메모

- 로컬 개발자용 env와 배포용 env는 분리 유지
- 운영 자동화/모니터링 스택은 앱 스택과 분리 유지
- 장기적으로는 Data 계층을 별도 EC2로 분리하는 방향 유지
