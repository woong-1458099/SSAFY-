# CI/CD Runbook

## 목적

- `backend-ci`: 빠른 CI(기본 테스트)
- `backend-integration`: 통합 테스트(정기/수동)

## Jenkins Job 구성

1. `backend-ci`
- 트리거: GitLab Push/MR 이벤트
- 브랜치: `develop`
- 실행: `clean test` (빠른 검증)

2. `backend-integration`
- 트리거: 주기 실행(예: `H 2 * * *`) 또는 수동
- 브랜치: `develop`
- 실행: `integrationTest` (Testcontainers 포함)

3. `backend-cd-develop` (배포 자동화)
- 기준 스크립트: `jenkins/Jenkinsfile.cd-develop`
- 용도: `api-blue/api-green` 배포 + nginx upstream 전환

## 공통 파이프라인 흐름

1. `deleteDir()`로 워크스페이스 초기화
2. GitLab 토큰으로 `develop` 브랜치 clone
3. `BackEnd`에서 Gradle 실행

## 필수 Credential

1. `gitlab-token-string`
- 타입: `Secret text`
- 용도: GitLab HTTPS clone 인증

2. `ec2-deploy-ssh`
- 타입: `SSH Username with private key`
- 용도: 추후 EC2 배포용

## JDK/Gradle 기준

- Jenkins 컨테이너에 JDK 25 설치
- 빌드 시 환경 변수:
  - `JAVA_HOME=/opt/jdk-25`
  - `PATH=$JAVA_HOME/bin:$PATH`
  - Gradle 옵션: `-Dorg.gradle.java.installations.paths=/opt/jdk-25`

## 테스트 분리 규칙

- 기본 `test` 태스크: `integration` 태그 제외
- `integrationTest` 태스크: `integration` 태그만 실행
- `GameInfraTestApplicationTests`는 `@Tag("integration")` 적용

## 장애 대응 가이드

1. `RyukResourceReaper` 오류
- 원인: Jenkins/Testcontainers 환경 충돌
- 조치: 통합테스트를 `backend-integration` 잡으로 분리 유지

2. `gradlew not found`
- 원인: wrapper 파일 누락 또는 브랜치 미반영
- 조치: `BackEnd/gradlew`, `gradle/wrapper/*` 커밋 확인

3. Git 인증 실패
- 원인: Credential 타입/ID 불일치
- 조치: `gitlab-token-string` 사용 여부 및 ID 확인

## 운영 원칙

- `develop`에서 CI 검증 완료 후 `master(main)` 배포 반영
- 빠른 피드백은 `backend-ci`, 무거운 검증은 `backend-integration`에 위임

## 작업 이력 (2026-03-05)

1. Jenkins Pipeline 문법 이슈 정리
- 증상: `WorkflowScript: expecting '''` 컴파일 에러 발생
- 원인: `sh '...'` 또는 `sh '''...'''` 내부 `git clone` 명령이 줄바꿈으로 끊겨 문자열 파싱 실패
- 조치: `git clone --depth 1 --branch develop <repo> .` 형태로 한 줄 실행되도록 수정

2. Checkout 실행 이슈 정리
- 증상: `fatal: You must specify a repository to clone.`
- 원인: `develop` 뒤 줄바꿈으로 저장소 URL이 같은 명령으로 전달되지 않음
- 조치: `git clone` 명령을 단일 라인으로 고정

3. GitLab/Jenkins 연동 확인
- Jenkins GitLab Connection: `E206` 선택
- GitLab URL: `https://lab.ssafy.com`
- Credential: API Token 기반(`웹훅 Jenkins 키`) 사용하여 연결 통과
- 참고: Webhook/API 토큰과 Git Clone 인증(PAT/계정)은 목적이 다를 수 있으므로 분리 관리

4. 현 인프라 상태 메모
- 사내/현재 환경에서 22번 포트 제약으로 SSH 기반 배포는 보류
- 우선 HTTPS/API 경로 기준으로 CI 연동 정리 후, EC2 이전 시 SSH 배포로 전환 예정

## EC2 이전 시 운영 계획 (API + SSH)

1. 1단계: API로 통로 오픈
- EC2 보안그룹/방화벽/API 경유 정책으로 배포 통신 경로 먼저 확보

2. 2단계: Git 작업은 SSH 전환
- EC2 내 배포 사용자에 SSH 키 배치 후 GitLab Deploy Key 또는 개인 키로 `git clone/fetch` 수행
- Jenkins에는 `ec2-deploy-ssh` 크리덴셜을 사용해 원격 명령 실행

3. 3단계: CD 파이프라인 반영
- `jenkins/Jenkinsfile.cd-develop` 기준으로 SSH 접속 후 배포/헬스체크/업스트림 스위칭 수행
- 장애 시 blue/green 롤백 절차 유지

## 2026-03-09 CI/CD 운영 기준 확정

### 브랜치 역할

- `develop`: 개발 통합 브랜치
- `master`: 배포 기준 브랜치
- `master`는 direct push를 허용하지 않고 MR merge만 허용한다.

### Jenkins 잡 기준

1. `develop-mr-ci-dev-deploy`
- 트리거: `develop` 대상 MR 생성/업데이트
- 실행 범위: `test -> build -> docker image build -> dev 환경 배포 -> health check`
- 추가 작업: n8n 코드리뷰 워크플로우 트리거
- 대상 정책: 모든 MR 대상

2. `master-merge-cd`
- 트리거: `develop -> master` MR merge 후 `master` 브랜치 갱신
- 실행 범위: blue/green 배포 -> health check -> nginx upstream 전환
- 실패 정책: health check 실패 또는 전환 검증 실패 시 이전 슬롯으로 rollback

3. `nightly-deploy`
- 용도: 필요 시 수동으로 활성화하는 예약 배포 잡
- 기본 정책: 기본 비활성 상태 유지
- 예정 시각: 새벽 2시 기준으로 사용 가능하도록 유지
- 비고: 초기 운영에서는 상시 활성화하지 않는다.

### 배포 환경 기준

- MR 검증 결과는 개발자 확인을 위해 개발 환경에 자동 반영한다.
- 실제 배포 서버 반영은 `master` merge 이후에만 수행한다.
- 개발 환경은 단일 환경을 사용하며, 최신 MR 기준으로 덮어쓴다.

### 리뷰 및 권한 정책

- 모든 MR에 대해 n8n 기반 코드리뷰 코멘트를 남긴다.
- 리뷰 프롬프트는 추후 언어별로 별도 정리한다.
- 현재 팀 운영 특성상 모든 팀원이 MR 생성/승인 가능하도록 유지한다.
- 권한을 넓게 두는 대신 Jenkins 배포 이력과 rollback 절차를 운영 기준으로 삼는다.
