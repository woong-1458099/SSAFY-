# n8n Local Setup

Architecture detail:
- `Infra/n8n/ARCHITECTURE.md`

## 1) Prepare env

1. Copy `.env.example` to `.env`
2. Fill Jenkins values:
- `JENKINS_BASE_URL`
- `JENKINS_JOB_NAME`
- `JENKINS_USER`
- `JENKINS_API_TOKEN`
- `JENKINS_REMOTE_TOKEN`

Recommended local value:
- `JENKINS_BASE_URL=http://host.docker.internal:8080`

## 2) Run n8n

```bash
cd Infra/n8n
cp .env.example .env
docker compose --env-file .env -f compose.n8n.yml up -d
```

Open:
- `http://localhost:5678`

## 3) Import workflow

Import JSON file:
- `Infra/n8n/workflows/local-jenkins-manual.json`
- `Infra/n8n/workflows/local-jenkins-cron.json`
- `Infra/n8n/workflows/mr-review-main.json`

Workflow flow:
1. Manual Trigger
2. Set Payload (`branch=develop`)
3. Trigger Jenkins Build (`buildWithParameters`)
4. Success/Failure branch

`local-jenkins-cron.json`:
- `Schedule Trigger(5m)`가 포함되어 있어 `Active` 토글 가능

`mr-review-main.json`:
1. GitLab Webhook 수신 (`/webhook/gitlab/mr-review`)
2. MR 이벤트 필터링
3. GitLab changes 조회
4. OpenAI(Codex) 리뷰 생성
5. GitLab MR 코멘트 등록
6. Sheets Webhook으로 결과 적재

## 4) Jenkins side checklist

1. Job name matches `JENKINS_JOB_NAME`
2. Jenkins user API token is valid
3. Job has remote trigger token (`JENKINS_REMOTE_TOKEN`)
4. User has build permission for target job

Queue/build 확인 API(선택):

```bash
curl -u "$JENKINS_USER:$JENKINS_API_TOKEN" "$JENKINS_BASE_URL/queue/api/json"
curl -u "$JENKINS_USER:$JENKINS_API_TOKEN" "$JENKINS_BASE_URL/job/$JENKINS_JOB_NAME/lastBuild/api/json"
```

## 5) Known local limitations

- Current local network may block direct GitLab Webhook -> Jenkins callback.
- Until EC2 migration, validate with Manual Trigger or Cron/Polling in n8n.
- After EC2 migration, switch inbound trigger to Webhook node and keep Jenkins trigger node as-is.
