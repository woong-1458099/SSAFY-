# n8n 배포 알림 자동화 정리

## 목적
Jenkins 배포 결과를 n8n Webhook으로 받고, 서비스 종류에 따라 Mattermost 채널로 자동 알림을 보낸다.

## 현재 기준 파일
- 워크플로 JSON: `Infra/n8n_Deploy_NotifyBot.json`

이 파일을 기준으로 n8n 운영 워크플로를 관리한다.

## 전체 흐름
1. Jenkins 배포 완료 또는 실패
2. Jenkins가 n8n Webhook으로 POST 요청 전송
3. n8n이 payload를 정규화
4. `result=NOT_BUILT` 이면 알림 전송 없이 skip 응답 반환
5. `service=frontend` 이면 프론트 Mattermost 채널 전송
6. 그 외는 백엔드 Mattermost 채널 전송
7. n8n이 webhook 응답 반환

## Webhook 정보
- URL: `https://n8n.ssafymaker.cloud/webhook/jenkins/deploy-notify`
- Method: `POST`
- 인증 방식: Header Auth
- Jenkins 헤더: `X-Deploy-Token`
- Jenkins credential: `n8n-deploy-token`

## Mattermost 채널 분기
- frontend 채널 webhook:
    - `https://meeting.ssafy.com/hooks/daoqsobzkbrotbpf5boim5k5ue`
- backend 채널 webhook:
    - `https://meeting.ssafy.com/hooks/khximapmo7bqmberdfsahn5bca`

분기 기준은 payload의 `service` 값이다.
- `frontend` -> 프론트 채널
- 그 외 -> 백엔드 채널

## Jenkins 연동 상태
현재 Jenkinsfile 4종은 모두 같은 n8n webhook 경로로 호출하도록 연결되어 있다.

- `jenkins/Jenkinsfile.frontend-develop-stg`
- `jenkins/Jenkinsfile.frontend-master-prod`
- `jenkins/Jenkinsfile.backend-develop-stg`
- `jenkins/Jenkinsfile.backend-master-prod`

## payload 정규화 기준
n8n Code 노드에서 아래 값을 정규화해서 사용한다.

- result
    - `body.result`
    - `body.status`
    - `body.buildResult`
- service
    - `body.service`
    - `body.component`
- environment
    - `body.environment`
    - `body.env`
- jobName
    - `body.jobName`
    - `body.job_name`
    - `body.pipeline`
- buildNumber
    - `body.buildNumber`
    - `body.build_number`
    - `body.number`
- buildUrl
    - `body.buildUrl`
    - `body.build_url`
    - `body.url`
- branch
    - `body.branch`
    - `body.gitBranch`
    - `body.branchName`
- releaseTag
    - `body.releaseTag`
    - `body.release_tag`
    - `body.version`
- image
    - `body.image`
    - `body.imageTag`
    - `body.image_tag`
- targetColor
    - `body.targetColor`
    - `body.target_color`
- activeColor
    - `body.activeColor`
    - `body.active_color`
- failedStage
    - `body.failedStage`
    - `body.failed_stage`
    - `body.stage`
- triggeredBy
    - `body.triggeredBy`
    - `body.triggered_by`
- message
    - `body.message`
- finishedAt
    - `body.finishedAt`
    - `body.finished_at`
    - 없으면 현재 시각 사용

## result 처리 기준
허용 상태값은 아래와 같다.

- `SUCCESS`
- `FAILURE`
- `UNSTABLE`
- `ABORTED`
- `NOT_BUILT`

이 외 값은 `UNKNOWN` 으로 처리한다.

## 알림 메시지 형식
현재 헤더 형식은 아래처럼 사용한다.

- `Front_개발_배포 성공`
- `Front_운영_배포 성공`
- `Back_개발_배포 실패`
- `Back_운영_배포 실패`

예시:
- `### :shark_cheer2: Front_개발_배포 성공 :shark_cheer2:`
- `### :shark_no2: Back_개발_배포 실패 :shark_no2:`

본문에는 아래 값들을 조건부로 추가한다.
- 잡 번호
- 브랜치
- 릴리즈 태그
- 이미지
- 배포 색상
- 현재 활성 색상
- 실패 단계
- 실행자
- 완료 시각
- 메시지
- Jenkins 빌드 링크

## NOT_BUILT 처리
`result=NOT_BUILT` 인 경우에는 Mattermost로 전송하지 않는다.

이 경우 n8n은 아래 의미의 응답만 반환한다.
- `ok: true`
- `skipped: true`
- `reason: not-built`

즉 path filter나 branch guard로 Jenkins가 `NOT_BUILT` 된 경우, 불필요한 알림을 막기 위한 처리다.

## Jenkins payload 예시

### frontend 성공
```json
{
  "jobName": "frontend-develop-stg",
  "buildNumber": "66",
  "result": "SUCCESS",
  "buildUrl": "https://jenkins.ssafymaker.cloud/job/frontend-develop-stg/66/",
  "branch": "develop",
  "service": "frontend",
  "environment": "stg",
  "releaseTag": "f5ee7c2d18bb"
}
```
### backend 성공
```json
{
"jobName": "backend-develop-stg",
"buildNumber": "84",
"result": "SUCCESS",
"buildUrl": "https://jenkins.ssafymaker.cloud/job/backend-develop-stg/84/",
"branch": "develop",
"service": "backend",
"environment": "stg",
"image": "s14p21e206-backend:f5ee7c2d18bb",
"targetColor": "green",
"activeColor": "blue"
}
```
### backend 실패
```json
{
  "jobName": "backend-develop-stg",
  "buildNumber": "80",
  "result": "FAILURE",
  "buildUrl": "https://jenkins.ssafymaker.cloud/job/backend-develop-stg/80/",
  "branch": "develop",
  "service": "backend",
  "environment": "stg",
  "image": "s14p21e206-backend:92f9fc08c07c",
  "targetColor": "green",
  "activeColor": "blue"
}
```

## 운영 확인 포인트
- n8n 운영 워크플로가 `Infra/n8n_Deploy_NotifyBot.json` 과 동일한지 확인
- Header Auth credential이 실제 운영 credential과 연결되어 있는지 확인
- frontend/backend 채널 webhook 주소가 맞는지 확인
- Jenkins 각 job에서 `X-Deploy-Token` 헤더가 실제로 전송되는지 확인
- `NOT_BUILT` 시 Mattermost 메시지가 오지 않는지 확인

## 장애 확인 포인트
백엔드와 프론트 메시지 포맷이 다르게 보이면 아래를 먼저 의심한다.

- n8n 운영 워크플로가 저장소 JSON과 다르다
- frontend와 backend가 서로 다른 워크플로를 타고 있다
- 운영 n8n에서 이전 버전 Code 노드가 아직 활성화되어 있다

## 후속 개선 후보
- 실패 시 `failedStage` 를 Jenkins에서 항상 보내도록 확장
- `triggeredBy` 를 함께 보내서 수동 실행자 추적 가능하게 개선
- `prod/stg` 외 추가 환경이 생기면 environment label map 확장
- Mattermost 메시지에 서비스별 고정 prefix 추가