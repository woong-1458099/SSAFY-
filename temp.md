구성 원칙

- 스택을 역할별로 분리한다.
- 환경값은 용도별로 분리한다.
- 같은 배포 파일을 쓰더라도 프로젝트 이름(-p)으로 stg/prod를 분리한다.

스택 분리

- App 스택
    - 역할: 실제 서비스 트래픽 처리
    - 구성: nginx, api-blue, api-green
- Data 스택
    - 역할: 상태 저장/메시징
    - 구성: postgres, redis, rabbitmq
- Ops 스택
    - 역할: CI/CD, 자동화, 관측
    - 구성: jenkins, n8n, prometheus, grafana

환경 분리

- local: 개발자 로컬 검증
- stg: 스테이징 배포/검증
- prod: 운영 배포
- ops: 운영도구 전용 설정

트래픽 흐름

1. 사용자 요청이 진입점(Nginx/ALB)으로 들어온다.
2. 도메인/라우팅 기준으로 stg 또는 prod 앱 스택으로 전달된다.
3. 앱은 환경변수로 지정된 Data 스택(Postgres/Redis/RabbitMQ)에 연결한다.
4. Ops 스택은 배포/자동화/모니터링을 담당하며 앱과 역할을 분리해 운영한다.

stg/prod 동시 운영 방식

- 같은 앱 스택 정의를 사용한다.
- 실행 시 프로젝트명을 다르게 준다(-p stg, -p prod).
- 결과적으로 컨테이너/네트워크/볼륨 네임스페이스가 분리되어 충돌 없이 공존한다.

운영도구 분리 기준

- 기본: Jenkins/n8n/Prometheus/Grafana는 1세트 운영 + 환경 라벨/잡 분기
- 고보안/고위험: prod만 물리 분리

로컬 개발자 연결 방식

- 방법 1: 로컬에서 Data 스택만 띄워 개발
- 방법 2: SSH 터널로 원격 Data 스택 연결
- 키 정책: 개인키는 각자 생성, 공개키만 등록

간단 정리

- “서비스(App) / 데이터(Data) / 운영(Ops)” 3축으로 분리한다.
- “local/stg/prod/ops” 환경값을 분리해 책임을 나눈다.
- stg/prod는 같은 정의를 쓰되 -p로 분리해 안정적으로 동시 운영한다.