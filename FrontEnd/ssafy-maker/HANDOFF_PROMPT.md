# SSAFYTraineeRaisingWeb(Asset) 작업 핸드오프 프롬프트

아래 내용 기준으로 작업 이어서 진행해줘.

## 프로젝트 경로
- `C:\Users\SSAFY\Documents\PhaserProjects\SSAFYTraineeRaisingWeb(Asset)`

## 현재 적용된 핵심 흐름
- 로그인 성공 -> `StartScene`
- Start(새 게임/이어하기 버튼) -> `IntroScene`
- 인트로 종료/스킵 -> `NewCharacterScene`
- 캐릭터 생성 완료 -> `MainScene`

## 이미 반영된 주요 변경 사항
1. 씬 연결/등록
- `src/app/registry/scenes.ts`에 `StartScene`, `IntroScene`, `NewCharacterScene` 등록
- `src/shared/enums/sceneKey.ts`에 `Start`, `Intro`, `NewCharacter` 사용

2. 로그인/시작/인트로
- `src/scenes/LoginScene.ts`: 로그인 성공 시 `SceneKey.Start`로 이동
- `src/scenes/StartScene.ts`: 버튼 클릭 시 `SceneKey.Intro` 이동
- `src/scenes/IntroScene.ts`: 인트로 종료 시 `SceneKey.NewCharacter` 이동

3. 캐릭터 생성
- `src/scenes/NewCharacterScene.ts` 재작성
- 이름/타입/성향 선택 후 `playerData` 저장, `SceneKey.Main` 이동

4. AP/시간 규칙 (MainScene)
- `src/scenes/MainScene.ts`
- AP를 하루 4로 변경
- 시간 순환: `오전 -> 오후 -> 저녁 -> 밤`
- AP 소모 공통 처리 `spendActionPoint()` 적용
- AP 4개 소모 시 다음날 오전으로 넘어가며 AP 4로 리셋
- 요일 순환 및 주차 증가 처리
- 집 행동/카페/번화가 시설 사용에 AP 소모 연결

## 현재 상태에서 확인된 제약/미구현
- 저장/불러오기 탭은 버튼과 토스트만 있는 MVP 상태 (실제 직렬화/복원 로직 없음)
- 로그인/회원가입/아이디찾기/비번찾기는 서버 연동 없는 클라이언트 UI 목업 흐름
- 문구 일부가 인코딩 깨져 보이는 파일이 있음 (기능에는 영향 없지만 텍스트 정리 필요)

## 다음 작업 시 우선 확인할 것
1. 실제 실행 폴더가 `SSAFYTraineeRaisingWeb(Asset)`인지 확인
2. 실행 전 강력 새로고침 (`Ctrl + F5`)으로 캐시 영향 제거
3. 인트로 후 캐릭터 생성 미진입 시:
- `IntroScene.startMainScene()` 목적지가 `SceneKey.NewCharacter`인지
- `scenes.ts`에 `NewCharacterScene` 등록되어 있는지

## 최근 빌드 상태
- `npm run build` 통과 확인됨

