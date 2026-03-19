# MainScene Media Guide

## 목적

`MainScene`에서 배경 이미지, 맵별 BGM, 효과음을 어디에 붙여야 하는지 빠르게 찾기 위한 문서입니다.

지금 구조의 핵심은 다음입니다.

- 배경/BGM 자산 목록과 맵별 BGM 매핑은 `src/features/main-scene/mainSceneMedia.ts`
- 실제 preload는 `src/scenes/PreloadScene.ts`
- 실제 맵 전환과 재생 호출은 `src/scenes/MainScene.ts`
- 볼륨 제어는 `src/core/managers/AudioManager.ts`

---

## 지금 구조 한눈에 보기

### 1. 맵 전환 기준

`MainScene`은 현재 `AreaId` 기준으로 맵을 나눕니다.

```ts
type AreaId = "world" | "downtown" | "campus";
```

즉 BGM도 이 기준으로 바뀝니다.

- `world`: 전체 지도
- `downtown`: 번화가
- `campus`: 캠퍼스

### 2. 실제 BGM 교체 시점

맵 이동은 `MainScene.enterArea()`에서 일어납니다.

그래서 맵별 BGM도 여기서 같이 바뀝니다.

```ts
this.areaBgm = syncMainSceneAreaBgm({
  scene: this,
  audioManager: this.audioManager,
  currentBgm: this.areaBgm,
  area
});
```

즉 팀원이 BGM을 바꾸고 싶으면:

1. `mainSceneMedia.ts`에 key/path를 넣고
2. 필요하면 맵별 key 매핑을 바꾸면 됩니다

`MainScene` 쪽은 이미 호출 뼈대가 들어가 있습니다.

---

## 가장 먼저 볼 파일

### `src/features/main-scene/mainSceneMedia.ts`

여기가 메인 파일입니다.

현재 들어있는 역할:

- 배경 이미지 preload 목록
- 메인씬 BGM preload 목록
- `area -> bgm key` 매핑
- 맵 전환 시 BGM 교체 helper
- loop 사운드 정리 helper
- 설정창 볼륨 slider와 `AudioManager` 연결 helper

### `src/scenes/PreloadScene.ts`

여기서 메인씬용 이미지/오디오를 미리 로드합니다.

현재 호출:

```ts
preloadMainSceneBackgroundAssets(this);
preloadMainSceneAudioAssets(this);
```

### `src/scenes/MainScene.ts`

여기는 직접 key/path를 넣는 곳이 아니라, helper를 호출하는 곳입니다.

현재 역할:

- 맵 전환 시 `syncMainSceneAreaBgm(...)` 호출
- 씬 종료 시 `destroyMainSceneLoopSound(...)` 호출

---

## 맵별 BGM 적용 방법

## 1. 오디오 파일 준비

예시:

- `public/assets/game/audio/bgm/main-world.mp3`
- `public/assets/game/audio/bgm/main-downtown.mp3`
- `public/assets/game/audio/bgm/main-campus.mp3`

파일명은 예시일 뿐입니다. 팀 규칙에 맞게 바꿔도 됩니다.

## 2. `mainSceneMedia.ts`에 preload 목록 추가

파일:

- `src/features/main-scene/mainSceneMedia.ts`

현재는 예시 주석만 들어 있습니다.

```ts
export const MAIN_SCENE_BGM_ASSETS: Array<{ key: string; path: string }> = [
  // Example BGM assets. Add real files here when the team is ready.
  // { key: "mainscene-bgm-world", path: "assets/game/audio/bgm/main-world.mp3" },
  // { key: "mainscene-bgm-downtown", path: "assets/game/audio/bgm/main-downtown.mp3" },
  // { key: "mainscene-bgm-campus", path: "assets/game/audio/bgm/main-campus.mp3" }
];
```

실제로는 이렇게 바꾸면 됩니다.

```ts
export const MAIN_SCENE_BGM_ASSETS: Array<{ key: string; path: string }> = [
  { key: "mainscene-bgm-world", path: "assets/game/audio/bgm/main-world.mp3" },
  { key: "mainscene-bgm-downtown", path: "assets/game/audio/bgm/main-downtown.mp3" },
  { key: "mainscene-bgm-campus", path: "assets/game/audio/bgm/main-campus.mp3" }
];
```

## 3. 맵별 key 매핑 확인

같은 파일에 맵별 BGM key 매핑이 있습니다.

```ts
export const MAIN_SCENE_AREA_BGM_KEYS: Partial<Record<AreaId, string>> = {
  world: "mainscene-bgm-world",
  downtown: "mainscene-bgm-downtown",
  campus: "mainscene-bgm-campus"
};
```

예를 들어 번화가에 다른 곡을 쓰고 싶으면 `downtown` 값만 바꾸면 됩니다.

```ts
export const MAIN_SCENE_AREA_BGM_KEYS: Partial<Record<AreaId, string>> = {
  world: "mainscene-bgm-world",
  downtown: "mainscene-bgm-city-night",
  campus: "mainscene-bgm-campus"
};
```

단, 이 경우 preload 목록에도 같은 key가 있어야 합니다.

## 4. 끝

여기까지만 하면 됩니다.

이유:

- `PreloadScene`는 이미 `preloadMainSceneAudioAssets(this)`를 호출 중
- `MainScene`는 이미 `enterArea()`에서 `syncMainSceneAreaBgm(...)`를 호출 중
- `MainScene`는 이미 종료 시 정리까지 하고 있음

즉 지금은 팀원이 보통 `mainSceneMedia.ts`만 수정하면 됩니다.

---

## 실제 동작 흐름

## 예시 1. 게임 시작 후 전체 지도 진입

`MainScene`가 처음 `enterArea("world", "downtown")`를 호출합니다.

그러면 내부적으로:

1. 현재 area가 `world`로 바뀜
2. `syncMainSceneAreaBgm(...)` 호출
3. `MAIN_SCENE_AREA_BGM_KEYS.world` 확인
4. `"mainscene-bgm-world"` 재생

## 예시 2. 전체 지도에서 캠퍼스로 이동

플레이어가 캠퍼스로 들어가면:

1. `enterArea("campus", "campus")` 호출
2. `syncMainSceneAreaBgm(...)` 호출
3. 기존 BGM stop/destroy
4. `"mainscene-bgm-campus"` 새로 add/play

## 예시 3. 같은 맵 안에서 다시 호출된 경우

이미 `campus` BGM이 재생 중이면 helper가 같은 key인지 확인하고 그대로 둡니다.

즉 같은 곡을 매번 다시 만들지 않습니다.

---

## 왜 이 구조가 좋은가

### 좋은 점

- `MainScene`에 곡 이름 하드코딩이 쌓이지 않음
- 팀원이 맵별 BGM 수정할 때 볼 파일이 거의 하나로 줄어듦
- 나중에 실제로 `CampusScene`, `DowntownScene`로 쪼개더라도 오디오 정책은 재사용 가능

### 피해야 할 방식

이런 식으로 `MainScene` 안에서 직접 if/else를 계속 늘리는 방식은 피하는 게 좋습니다.

```ts
if (area === "world") {
  ...
} else if (area === "downtown") {
  ...
} else if (area === "campus") {
  ...
}
```

이 방식은 당장은 되지만, 나중에 장소가 늘어나면 `MainScene`만 더 커집니다.

지금처럼 `mainSceneMedia.ts`에 매핑을 두는 편이 더 낫습니다.

---

## 배경 이미지 추가 방법

배경 이미지는 BGM과 비슷하지만, 장소 단위로 연결됩니다.

## 1. 이미지 파일 추가

예시:

- `public/assets/game/backgrounds/library.png`

## 2. background key 추가

파일:

- `src/shared/constants/placeBackgroundKeys.ts`

예시:

```ts
export const PLACE_BACKGROUND_KEYS = {
  ...
  library: "place-bg-library"
} as const;
```

## 3. preload 목록 추가

파일:

- `src/features/main-scene/mainSceneMedia.ts`

예시:

```ts
export const MAIN_SCENE_BACKGROUND_ASSETS = [
  ...
  { key: PLACE_BACKGROUND_KEYS.library, path: "assets/game/backgrounds/library.png" }
] as const;
```

## 4. 장소와 배경 key 연결

파일:

- `src/features/place/placeActions.ts`

예시:

```ts
if (placeId === "library") return PLACE_BACKGROUND_KEYS.library;
```

번화가 건물이라면 건물용 resolver에서 연결하면 됩니다.

---

## SFX 넣는 방법

효과음은 loop가 아니므로 보통 `add()`보다 `play()`가 맞습니다.

## 1. preload

예시:

```ts
this.load.audio("mainscene-click", "assets/game/audio/sfx/click.wav");
this.load.audio("mainscene-open-popup", "assets/game/audio/sfx/open-popup.mp3");
```

공용화하려면 BGM처럼 `mainSceneMedia.ts`에 별도 배열을 만들어도 됩니다.

## 2. 필요한 곳에서 재생

예시:

```ts
this.audioManager.play(this, "mainscene-click", "sfx", { volume: 0.8 });
```

붙이기 좋은 위치:

- `openDowntownBuildingPopup()`
- `openPlacePopup()`
- `openShop()`
- `purchaseFromShop()`
- 대화 진행 버튼 처리 로직

---

## ambience 넣는 방법

사람 소리, 거리 소리, 카페 배경음처럼 BGM과 분리하고 싶은 반복음은 `ambience`로 두는 편이 좋습니다.

예시:

```ts
const cityAmbience = this.audioManager.add(this, "mainscene-city-ambience", "ambience", {
  loop: true,
  volume: 0.45
});

cityAmbience?.play();
```

이 경우도 BGM처럼 helper로 묶는 것을 권장합니다.

---

## 팀원이 실제로 수정하면 되는 최소 지점

### 맵별 BGM만 바꾸는 경우

거의 항상 이 파일만 보면 됩니다.

- `src/features/main-scene/mainSceneMedia.ts`

수정할 것:

1. `MAIN_SCENE_BGM_ASSETS`
2. `MAIN_SCENE_AREA_BGM_KEYS`

### 새 배경 이미지 추가

- `src/shared/constants/placeBackgroundKeys.ts`
- `src/features/main-scene/mainSceneMedia.ts`
- `src/features/place/placeActions.ts`

### 효과음 추가

- preload 위치
- 실제 재생 위치

공용화 필요 시:

- `src/features/main-scene/mainSceneMedia.ts`

---

## 체크리스트

### BGM이 안 나올 때

- `MAIN_SCENE_BGM_ASSETS`에 실제 path가 들어갔는지
- key 이름이 `MAIN_SCENE_AREA_BGM_KEYS`와 정확히 같은지
- 파일 경로가 `public/assets/...` 기준으로 맞는지
- area가 실제로 `world`, `downtown`, `campus` 중 어디로 들어가는지
- 콘솔에 `Missing BGM asset` 경고가 뜨는지

### 배경 이미지가 안 보일 때

- `MAIN_SCENE_BACKGROUND_ASSETS`에 preload가 들어갔는지
- `PLACE_BACKGROUND_KEYS`에 key가 추가됐는지
- `placeActions.ts`에서 장소와 key 연결이 됐는지

### 효과음이 안 나올 때

- preload key와 재생 key가 같은지
- `audioManager.play(..., "sfx")`로 재생했는지
- 실제 이벤트 함수가 호출되는지

---

## 권장 규칙

- asset 경로 문자열은 가능하면 `MainScene`에 직접 적지 말 것
- 맵별 BGM 정책은 `mainSceneMedia.ts`에 모을 것
- 실제 재생/볼륨은 `AudioManager`를 통해서만 처리할 것
- loop 사운드는 반드시 shutdown에서 정리할 것
- `MainScene`에는 “무엇을 재생할지 결정하는 로직”보다 “helper 호출”만 남길 것
