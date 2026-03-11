# BRANCH_STRATEGY

## 브랜치 접두사

- `feat/ui/*`
- `feat/art/*`
- `feat/minigame/*`
- `feat/ai/*`
- `feat/story/*`
- `chore/infra/*`
- `fix/ui/*`
- `fix/minigame/*`

## 브랜치명 예시

- `feat/ui/escape-menu-layout`
- `feat/minigame/001-core-loop`
- `feat/story/ch1-dialog-flow`
- `chore/infra/path-alias-cleanup`
- `fix/ui/tab-switch-highlight`

## PR 제목 예시

- `[UI] ESC 메뉴 와이어프레임 추가`
- `[MINIGAME-001] 점수 계산 버그 수정`
- `[INFRA] Vite alias 정리`

## 커밋 메시지 예시

- `feat(ui): add escape menu skeleton`
- `feat(story): add chapter1 dialogue sample`
- `fix(minigame-001): correct timer reset`
- `chore(infra): align tsconfig paths`

## 운영 규칙

- 한 브랜치에는 한 목적만 담습니다.
- PR 전에 `npm run build`를 통과해야 합니다.
- 대규모 리팩터링은 기능 PR과 분리합니다.