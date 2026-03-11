# UI 에셋 연동 가이드 (아트 후반 부착용)

목적: 현재는 로직/레이아웃 먼저 개발하고, 아트 산출물 완료 후 UI 리소스를 안전하게 붙이기 위한 절차를 정리한다.

## 1. 현재 구조

- UI 키 레지스트리: `src/features/ui/assets/ui-asset-keys.ts`
- UI 프리로드 스텁: `src/features/ui/assets/preload-ui-assets.ts`
- 프리로드 연결 지점: `src/scenes/PreloadScene.ts`

현재 `UI_ASSET_MANIFEST`는 빈 배열이므로, 아트가 없어도 게임이 정상 동작한다.

## 2. 아트 파일 배치 규칙

- 런타임 사용 파일은 반드시 `assets/game/ui/**`에 둔다.
- 원본 파일은 `assets/raw/**`에서 관리한다.
- 코드에서 `assets/raw`를 직접 로드하지 않는다.

예시:

- `assets/game/ui/panel_main.png`
- `assets/game/ui/panel_content.png`
- `assets/game/ui/tab_settings.png`
- `assets/game/ui/tab_stats.png`
- `assets/game/ui/tab_save.png`
- `assets/game/ui/button_primary.png`
- `assets/game/ui/button_primary_hover.png`

## 3. 실제 연동 순서

### 3-1. 키 확인

`src/features/ui/assets/ui-asset-keys.ts`에 준비된 키를 사용한다.

- `PANEL_MAIN`
- `PANEL_CONTENT`
- `TAB_SETTINGS`
- `TAB_STATS`
- `TAB_SAVE`
- `BUTTON_PRIMARY`
- `BUTTON_PRIMARY_HOVER`

새 리소스가 필요하면 키를 먼저 추가한다.

### 3-2. 프리로드 manifest 채우기

`src/features/ui/assets/preload-ui-assets.ts`의 `UI_ASSET_MANIFEST`에 항목을 추가한다.

```ts
const UI_ASSET_MANIFEST: UiAssetManifestItem[] = [
  { key: UI_ASSET_KEYS.PANEL_MAIN, path: "assets/game/ui/panel_main.png" },
  { key: UI_ASSET_KEYS.PANEL_CONTENT, path: "assets/game/ui/panel_content.png" },
  { key: UI_ASSET_KEYS.TAB_SETTINGS, path: "assets/game/ui/tab_settings.png" },
  { key: UI_ASSET_KEYS.TAB_STATS, path: "assets/game/ui/tab_stats.png" },
  { key: UI_ASSET_KEYS.TAB_SAVE, path: "assets/game/ui/tab_save.png" },
  { key: UI_ASSET_KEYS.BUTTON_PRIMARY, path: "assets/game/ui/button_primary.png" },
  { key: UI_ASSET_KEYS.BUTTON_PRIMARY_HOVER, path: "assets/game/ui/button_primary_hover.png" }
];
```

### 3-3. 씬의 placeholder 교체

현재 `MainScene`은 `rectangle/text` 기반 placeholder를 사용한다.

- 패널/탭/버튼을 `this.add.image(..., UI_ASSET_KEYS.XXX)`로 순차 교체
- 탭 전환 로직 `switchTab(tab)`은 유지
- 페이지 컨테이너(`createSettingsPage`, `createStatsPage`, `createSavePage`) 구조는 유지

핵심: “레이아웃/로직은 유지하고 렌더링 리소스만 교체”한다.

## 4. 교체 시 주의사항

- 좌표는 가능하면 정수값 유지 (`Math.round`)  
  픽셀아트 흔들림/블러 방지에 중요
- 탭 활성/비활성 상태는 기존 색상 처리 대신
  - 프레임 교체
  - 텍스처 교체
  - tint 조정
  중 하나로 일관되게 적용
- 한글 가독성 우선:
  - UI 본문 텍스트는 Phaser Text 유지 권장
  - BitmapText는 영문/숫자 중심으로 제한

## 5. 빠른 체크리스트

- [ ] 모든 UI 파일이 `assets/game/ui`에 존재하는가
- [ ] manifest key/path 오타가 없는가
- [ ] `npm run build` 통과하는가
- [ ] ESC 메뉴 열기/닫기 정상 동작하는가
- [ ] 탭 전환 시 본문만 바뀌는가
- [ ] 한글 텍스트가 깨지거나 흐리지 않은가

## 6. 추천 작업 단위

1. manifest 등록 PR  
2. 패널/탭 이미지 교체 PR  
3. 버튼/상태(hover/active) 교체 PR  
4. 최종 픽셀 정렬/여백 미세조정 PR

작업을 단계별 PR로 분리하면, 아트 변경과 로직 리스크를 분리해 검수하기 쉽다.
