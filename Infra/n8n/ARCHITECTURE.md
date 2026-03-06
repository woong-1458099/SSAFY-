# n8n Review Automation Architecture

## Goal

- MR 이벤트를 받아 자동으로 코드리뷰를 수행한다.
- 리뷰 결과를 GitLab MR 코멘트로 등록한다.
- 처리 결과를 Google Sheets에 `fix/feat/docs/refactor/test/chore` 대분류와 함께 기록한다.
- 실패 시 재시도/중복방지 기준을 명확히 둔다.

## Scope

1. 입력: GitLab MR Webhook (EC2 이전 전에는 Polling/Cron 대체)
2. 처리: n8n -> Codex(OpenAI API) 리뷰 생성
3. 출력:
- GitLab MR Note(comment)
- Google Sheets Row append

## End-to-End Flow

1. `GitLab` MR 생성/업데이트/머지 이벤트 발생
2. `n8n Trigger`
- EC2 이전 전: `Cron + GitLab MR List API` 폴링
- EC2 이전 후: `Webhook` 직접 수신
3. `n8n Normalize`
- 프로젝트/브랜치/MR IID/커밋 SHA/작성자/변경파일 목록 정규화
4. `n8n Fetch Diff`
- `GET /projects/:id/merge_requests/:iid/changes`
5. `n8n Review Request`
- 변경 요약 + diff를 Codex(OpenAI) 입력으로 전달
6. `Codex Response Parse`
- severity, finding, suggestion, summary, category 추출
7. `GitLab Comment`
- `POST /projects/:id/merge_requests/:iid/notes`
8. `Google Sheets Append`
- MR 메타 + 분류 + 요약 + 처리시간 기록
9. `Audit/Retry`
- 실패 시 backoff 재시도 후 DLQ(실패 로그 시트/파일) 적재

## n8n Workflow Design

### Workflow A: `mr-review-main`

1. Trigger
- Local: `Cron` (예: 3분)
- EC2: `Webhook` (`/webhook/gitlab/mr`)

2. Validate & Deduplicate
- 키: `project_id:mr_iid:sha`
- 최근 처리 키 저장소(예: n8n static data 또는 Redis)
- 이미 처리된 키면 종료

3. Fetch MR Detail/Diff
- GitLab API 호출
- 변경 파일 수/라인 수가 임계치 초과 시 샘플링 또는 요약 모드 전환

4. Call Codex
- 입력: MR 제목/설명/변경파일/diff
- 출력 포맷: JSON 강제

5. Post Comment
- GitLab MR 노트로 리뷰 등록

6. Append Sheet
- 아래 스키마로 1행 추가

7. Mark Processed
- dedup 키 저장

### Workflow B: `mr-review-retry`

1. Trigger: `Error Trigger` or `Cron`
2. 실패 항목 재처리
3. 최대 재시도 초과 시 `review_failures` 시트 적재

## Codex Prompt Contract

## Input

- MR metadata: title, description, source/target branch
- changed files list
- unified diff (truncate policy 적용)

## Output JSON (필수)

```json
{
  "mr_type": "fix|feat|docs|refactor|test|chore",
  "summary": "one-paragraph summary",
  "overall_risk": "low|medium|high",
  "findings": [
    {
      "severity": "high|medium|low",
      "file": "path/to/file",
      "line_hint": "optional",
      "issue": "what is wrong",
      "suggestion": "how to fix"
    }
  ],
  "comment_markdown": "markdown body for GitLab note"
}
```

## Google Sheets Schema

시트명: `mr_reviews`

컬럼:
1. `timestamp`
2. `project`
3. `mr_iid`
4. `mr_title`
5. `author`
6. `source_branch`
7. `target_branch`
8. `commit_sha`
9. `mr_type` (`fix|feat|docs|refactor|test|chore`)
10. `overall_risk`
11. `summary`
12. `findings_count`
13. `jenkins_ci_url`
14. `jenkins_cd_url`
15. `gitlab_mr_url`
16. `status` (`success|failed|skipped`)
17. `error_message`

## GitLab API Points

- MR 목록/상세: `GET /api/v4/projects/:id/merge_requests`
- MR 변경사항: `GET /api/v4/projects/:id/merge_requests/:iid/changes`
- MR 코멘트: `POST /api/v4/projects/:id/merge_requests/:iid/notes`

필수 토큰 권한:
- 최소 `api` 또는 MR read/write 가능한 범위

## Jenkins 연계 포인트

- CI 성공 상태를 코멘트/시트에 포함하려면:
1. n8n이 Jenkins Build API 조회
2. `backend-ci` 결과 URL을 `jenkins_ci_url`에 기록
3. CD 실행 시 `jenkins_cd_url`도 기록

## Failure Handling Policy

1. GitLab API 실패: 3회 재시도(지수 백오프)
2. Codex 호출 실패: 2회 재시도 후 `failed`
3. Sheets 실패: 3회 재시도, 실패 시 파일/시트 DLQ 기록
4. 어떤 단계 실패든 `status=failed` 행은 남긴다.

## Idempotency Rules

- 동일 `project_id + mr_iid + commit_sha`는 1회만 코멘트 등록
- 재실행 시 기존 코멘트가 있으면 업데이트 또는 스킵
- 같은 SHA에서 중복 시트 적재 금지

## Security & Secrets

- n8n Credentials로만 보관(평문 env 최소화)
- 필요 시크릿:
1. `GITLAB_TOKEN`
2. `OPENAI_API_KEY`
3. `GOOGLE_SERVICE_ACCOUNT_JSON`
4. `JENKINS_USER/JENKINS_API_TOKEN`

- 로그에 토큰/키 노출 금지
- 외부 전송 데이터는 최소화(diff 크기 제한)

## Local vs EC2 Operation

1. Local 단계
- Trigger: Cron/Polling
- Jenkins 호출: `host.docker.internal`
- 목적: 노드 연결/권한/파싱 검증

2. EC2 단계
- Trigger: GitLab Webhook
- Jenkins/CD/SSH까지 종단 검증
- 운영 알림(실패/지연) 활성화

## Monitoring Dashboard (Prometheus/Grafana)

추적 지표:
1. `n8n_workflow_runs_total{workflow,status}`
2. `n8n_workflow_duration_seconds`
3. `mr_review_findings_count`
4. `mr_review_failures_total{stage}`
5. Jenkins CI/CD success rate

권장 대시보드 패널:
1. 시간대별 MR 처리량
2. 타입별(fix/feat/docs...) 분포
3. 실패 단계 Top N
4. 평균 처리시간
5. 최근 실패 상세

## Delivery Checklist

1. `Infra/n8n/.env` 값 설정 완료
2. n8n 워크플로우 `mr-review-main`/`mr-review-retry` 생성
3. GitLab 토큰 권한 테스트 완료
4. Google Sheets append 테스트 완료
5. Jenkins URL 연동 필드 검증 완료
6. 중복방지 키 동작 검증 완료
7. 실패 재시도/실패기록 검증 완료
