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
