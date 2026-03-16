# 2026-03-16 n8n deploy notify bot 초안

- Jenkins 배포 완료/실패 알림용 n8n 워크플로 초안을 추가했다.
- 추가 파일: `Infra/n8n_deploy_notify_bot.json`
- Mattermost 웹훅 `https://meeting.ssafy.com/hooks/daoqsobzkbrotbpf5boim5k5ue` 를 사용하도록 설정했다.
- Jenkins가 `POST`로 호출할 n8n Webhook path는 `jenkins/deploy-notify` 로 잡았다.
- 현재 초안은 import와 테스트를 쉽게 하려고 Webhook 인증 없이 작성했다. 운영 반영 전에는 n8n Webhook 인증 헤더 또는 별도 보호 장치를 붙이는 것이 필요하다.
