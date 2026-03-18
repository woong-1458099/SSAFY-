# CI/CD 운영 기준

이 문서는 GitLab, Jenkins, n8n 기반의 현재 CI/CD 흐름을 정리한다.

## 1. 전체 흐름
1. GitLab merge event 발생
2. GitLab webhook이 Jenkins `/project/<job>` 호출
3. Jenkins job이 Jenkinsfile을 SCM에서 읽고 배포 수행
4. 배포 완료 또는 실패 후 Jenkins가 n8n deploy notify webhook 호출
5. n8n이 Mattermost 알림 전송

## 2. Jenkins 자동 트리거
현재 기준 Jenkins job은 GitLab webhook 기반으로 동작한다.

### Jenkins job
- `backend-develop-stg`
- `frontend-develop-stg`
- `backend-master-prod`
- `frontend-master-prod`

### Jenkins webhook URL
- `https://jenkins.ssafymaker.cloud/project/backend-develop-stg`
- `https://jenkins.ssafymaker.cloud/project/frontend-develop-stg`
- `https://jenkins.ssafymaker.cloud/project/backend-master-prod`
- `https://jenkins.ssafymaker.cloud/project/frontend-master-prod`

### Jenkins trigger 기준
- `Build when a change is pushed to GitLab`
- merge 기반 운영
- job별 webhook secret 사용

### backend-develop-stg 확인 기준
- Git SCM
- 브랜치 스펙: `*/develop`
- GitLab trigger 사용
- `Accepted Merge Request Events` 사용

## 3. nginx와 Jenkins webhook 경계
Jenkins UI 전체는 whitelist 보호를 유지한다.

예외:
- `location ^~ /project/`
  - GitLab webhook 수신용
  - whitelist 미적용

유지:
- `location /`
  - Jenkins UI
  - whitelist 적용

즉 Jenkins 전체를 외부 개방하는 것이 아니라 GitLab webhook ingress만 예외 처리한다.

## 4. Jenkins pipeline 파일
- `jenkins/Jenkinsfile.backend-develop-stg`
- `jenkins/Jenkinsfile.frontend-develop-stg`
- `jenkins/Jenkinsfile.backend-master-prod`
- `jenkins/Jenkinsfile.frontend-master-prod`

## 5. 배포 후 n8n 연동
Jenkins 각 파이프라인은 배포 완료 또는 실패 후 아래 n8n webhook을 호출한다.

- `https://n8n.ssafymaker.cloud/webhook/jenkins/deploy-notify`

이 endpoint는 Jenkins 전용이며 Header Auth 검증을 사용한다.

### Jenkins -> n8n credential
- Jenkins credential id: `n8n-deploy-token`
- n8n 쪽은 Header Auth credential로 검증

## 6. n8n 운영 워크플로
- `MR 리뷰 코멘트 Sheets.json`
- `n8n Deploy Notify Bot.json`
- `IP Whitelist Intake and Validate.json`
- `IP Whitelist Sync to Nginx.json`

## 7. GitLab과 n8n의 역할 분리
- GitLab -> Jenkins
  - CI/CD 시작
- Jenkins -> n8n
  - 배포 결과 알림
- GitLab -> n8n MR review webhook
  - MR 리뷰 자동화

서로 다른 webhook URL을 혼용하지 않는다.

## 8. 자주 보는 장애 유형
### 1) GitLab webhook 테스트 결과 403
- nginx whitelist 또는 경로 보호 문제일 가능성이 높다.
- `server: nginx` 또는 Cloudflare 뒤의 403 여부를 함께 본다.

### 2) GitLab webhook 테스트 결과 404
- Jenkins까지는 도달했으나 해당 endpoint/path 인식 문제가 있을 수 있다.
- Jenkins plugin 설정 또는 job webhook path를 다시 확인한다.

### 3) n8n deploy notify 403
- Jenkins가 올바른 Header Auth를 보내지 않는 경우
- `n8n-deploy-token` 과 n8n Header Auth 불일치 가능성

### 4) n8n webhook-test 404
- test 모드 webhook은 n8n 캔버스에서 실행 버튼을 눌렀을 때만 일시적으로 열리는 것이 정상이다.

## 9. Jenkins credential 기준
- `ec2-deploy-ssh-v2`
- `cloudflare-api-token`
- `cloudflare-zone-id`
- `n8n-deploy-token`

## 10. 운영 원칙
- Jenkins Root URL은 외부 접근 주소를 사용한다.
- Jenkins 내부 서비스간 통신 URL과 외부 공개 URL을 구분한다.
- webhook은 URL, event, secret을 함께 문서화한다.
- UI 보호와 webhook 예외는 분리해서 설계한다.
