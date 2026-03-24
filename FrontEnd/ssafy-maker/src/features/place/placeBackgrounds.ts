import Phaser from "phaser";
import { buildGameAssetPath } from "../../common/assets/gameAssetPath";
import type { AreaId, PlaceId } from "../../common/enums/area";
import { AudioManager } from "../../core/managers/AudioManager";

export type TimeOfDay = "오전" | "오후" | "저녁" | "밤";

export const PLACE_BACKGROUND_KEYS = {
  cafe: "place_bg_cafe",
  store: "place_bg_store",
  home: "place_bg_home",
  gym: "place_bg_gym",
  ramen: "place_bg_ramen",
  karaoke: "place_bg_karaoke",
  lotto: "place_bg_lotto",
  beer: "place_bg_beer"
} as const;

export const PLACE_BGM_KEYS = {
  cafe: "place_bgm_cafe",
  store: "place_bgm_store",
  home: "place_bgm_home",
  gym: "place_bgm_gym",
  ramen: "place_bgm_ramen",
  karaoke: "place_bgm_karaoke",
  lotto: "place_bgm_lotto",
  beer: "place_bgm_beer",
  world_오전: "place_bgm_world_morning",
  world_오후: "place_bgm_world_afternoon",
  world_저녁: "place_bgm_world_evening",
  world_밤: "place_bgm_world_night",
  campus: "place_bgm_campus",
  downtown: "place_bgm_downtown"
} as const;

export const SKY_BACKGROUND_KEYS = {
  day: "sky_bg_day",
  evening: "sky_bg_evening",
  night: "sky_bg_night",
} as const;

export const CLOUD_KEYS = {
  day_cloud1: "cloud_day_1",
  day_cloud2: "cloud_day_2",
  evening_cloud1: "cloud_evening_1",
  evening_cloud2: "cloud_evening_2",
  night_cloud1: "cloud_night_1",
  night_cloud2: "cloud_night_2",
} as const;

const PLACE_BACKGROUND_ASSETS: Array<{ key: string; path: string }> = [
  { key: PLACE_BACKGROUND_KEYS.cafe, path: buildGameAssetPath("backgrounds", "cafe.png") },
  { key: PLACE_BACKGROUND_KEYS.store, path: buildGameAssetPath("backgrounds", "conv.png") },
  { key: PLACE_BACKGROUND_KEYS.home, path: buildGameAssetPath("backgrounds", "myroom.png") },
  { key: PLACE_BACKGROUND_KEYS.gym, path: buildGameAssetPath("backgrounds", "gym.png") },
  { key: PLACE_BACKGROUND_KEYS.ramen, path: buildGameAssetPath("backgrounds", "ramenthings.png") },
  { key: PLACE_BACKGROUND_KEYS.karaoke, path: buildGameAssetPath("backgrounds", "singroom.png") },
  { key: PLACE_BACKGROUND_KEYS.lotto, path: buildGameAssetPath("backgrounds", "lotto.png") },
  { key: PLACE_BACKGROUND_KEYS.beer, path: buildGameAssetPath("backgrounds", "hoff.png") },
  { key: SKY_BACKGROUND_KEYS.day, path: buildGameAssetPath("backgrounds", "day_back.png") },
  { key: SKY_BACKGROUND_KEYS.evening, path: buildGameAssetPath("backgrounds", "evening_back.png") },
  { key: SKY_BACKGROUND_KEYS.night, path: buildGameAssetPath("backgrounds", "night_back.png") },
  { key: CLOUD_KEYS.day_cloud1, path: buildGameAssetPath("backgrounds", "day_cloud1.png") },
  { key: CLOUD_KEYS.day_cloud2, path: buildGameAssetPath("backgrounds", "day_cloud2.png") },
  { key: CLOUD_KEYS.evening_cloud1, path: buildGameAssetPath("backgrounds", "evening_cloud1.png") },
  { key: CLOUD_KEYS.evening_cloud2, path: buildGameAssetPath("backgrounds", "evening_cloud2.png") },
  { key: CLOUD_KEYS.night_cloud1, path: buildGameAssetPath("backgrounds", "night_cloud1.png") },
  { key: CLOUD_KEYS.night_cloud2, path: buildGameAssetPath("backgrounds", "night_cloud2.png") },
];

const PLACE_BGM_ASSETS = [
  { key: PLACE_BGM_KEYS.cafe, path: buildGameAssetPath("audio/BGM", "cafe.mp3") },
  { key: PLACE_BGM_KEYS.store, path: buildGameAssetPath("audio/BGM", "convenience_store.mp3") },
  { key: PLACE_BGM_KEYS.home, path: buildGameAssetPath("audio/BGM", "myRoom.mp3") },
  { key: PLACE_BGM_KEYS.gym, path: buildGameAssetPath("audio/BGM", "let's_go.mp3") },
  { key: PLACE_BGM_KEYS.ramen, path: buildGameAssetPath("audio/BGM", "ramen_store.mp3") },
  { key: PLACE_BGM_KEYS.karaoke, path: buildGameAssetPath("audio/BGM", "karaoke.mp3") },
  { key: PLACE_BGM_KEYS.lotto, path: buildGameAssetPath("audio/BGM", "lotto.mp3") },
  { key: PLACE_BGM_KEYS.beer, path: buildGameAssetPath("audio/BGM", "beer_store.mp3") },
  { key: PLACE_BGM_KEYS.campus, path: buildGameAssetPath("audio/BGM", "InSSAFY.mp3") },
  { key: PLACE_BGM_KEYS.downtown, path: buildGameAssetPath("audio/BGM", "city.mp3") },
  { key: PLACE_BGM_KEYS.world_오전, path: buildGameAssetPath("audio/BGM", "morning.mp3") },
  { key: PLACE_BGM_KEYS.world_오후, path: buildGameAssetPath("audio/BGM", "afternoon.mp3") },
  { key: PLACE_BGM_KEYS.world_저녁, path: buildGameAssetPath("audio/BGM", "evening.mp3") },
  { key: PLACE_BGM_KEYS.world_밤, path: buildGameAssetPath("audio/BGM", "night.mp3") },
];

const PLACE_BACKGROUND_ASSET_BY_KEY = new Map(
  PLACE_BACKGROUND_ASSETS.map((asset) => [asset.key, asset.path] as const)
);

const PLACE_BACKGROUND_KEY_BY_PLACE_ID: Partial<Record<PlaceId, string>> = {
  cafe: PLACE_BACKGROUND_KEYS.cafe,
  store: PLACE_BACKGROUND_KEYS.store,
  home: PLACE_BACKGROUND_KEYS.home,
  gym: PLACE_BACKGROUND_KEYS.gym,
  ramen: PLACE_BACKGROUND_KEYS.ramen,
  karaoke: PLACE_BACKGROUND_KEYS.karaoke,
  lotto: PLACE_BACKGROUND_KEYS.lotto,
  beer: PLACE_BACKGROUND_KEYS.beer
};

const PLACE_BGM_KEY_BY_PLACE_ID: Partial<Record<PlaceId, string>> = {
  cafe: PLACE_BGM_KEYS.cafe,
  store: PLACE_BGM_KEYS.store,
  home: PLACE_BGM_KEYS.home,
  gym: PLACE_BGM_KEYS.gym,
  ramen: PLACE_BGM_KEYS.ramen,
  karaoke: PLACE_BGM_KEYS.karaoke,
  lotto: PLACE_BGM_KEYS.lotto,
  beer: PLACE_BGM_KEYS.beer,
  campus: PLACE_BGM_KEYS.campus,
  downtown: PLACE_BGM_KEYS.downtown
};

const WORLD_BGM_KEY_BY_TIME: Record<TimeOfDay, string> = {
  오전: PLACE_BGM_KEYS.world_오전,
  오후: PLACE_BGM_KEYS.world_오후,
  저녁: PLACE_BGM_KEYS.world_저녁,
  밤: PLACE_BGM_KEYS.world_밤,
};

function getSkyBackgroundKey(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "오전":
    case "오후":
      return SKY_BACKGROUND_KEYS.day;
    case "저녁":
      return SKY_BACKGROUND_KEYS.evening;
    case "밤":
      return SKY_BACKGROUND_KEYS.night;
  }
}


function getCloudKeys(timeOfDay: TimeOfDay): [string, string] {
  switch (timeOfDay) {
    case "오전":
    case "오후":
      return [CLOUD_KEYS.day_cloud1, CLOUD_KEYS.day_cloud2];
    case "저녁":
      return [CLOUD_KEYS.evening_cloud1, CLOUD_KEYS.evening_cloud2];
    case "밤":
      return [CLOUD_KEYS.night_cloud1, CLOUD_KEYS.night_cloud2];
  }
}

export function preloadPlaceBackgroundAssets(scene: Phaser.Scene): void {
  PLACE_BACKGROUND_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
  PLACE_BGM_ASSETS.forEach((asset) => {
    scene.load.audio(asset.key, asset.path);
  });
}

function resumeAudioContext(scene: Phaser.Scene): Promise<void> {
  const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context;
  if (!ctx || ctx.state === "running") return Promise.resolve();
  return ctx.resume();
}

export async function playPlaceBgm(
  scene: Phaser.Scene,
  placeId: PlaceId,
  audioManager: AudioManager
): Promise<void> {
  const bgmKey = PLACE_BGM_KEY_BY_PLACE_ID[placeId];
  if (!bgmKey) return;

  if (!scene.cache.audio.exists(bgmKey)) {
    console.warn(`[BGM] 아직 로드되지 않은 BGM: ${bgmKey}`);
    return;
  }

  const existing = scene.sound.get(bgmKey);
  if (existing) {
    audioManager.registerManagedSound(existing, "bgm", 0.5);
    audioManager.updateManagedSoundVolume(existing, "bgm", 0.5);
    if (existing.isPlaying) {
      return;
    }
  }

  await resumeAudioContext(scene);
  audioManager.stopManagedSounds("bgm", { scene, exceptKey: bgmKey });
  if (existing) {
    existing.play();
    return;
  }

  const bgm = audioManager.add(scene, bgmKey, "bgm", { loop: true, volume: 0.5 });
  bgm?.play();
}

export async function playWorldBgm(
  scene: Phaser.Scene,
  timeOfDay: TimeOfDay,
  audioManager: AudioManager
): Promise<void> {
  const bgmKey = WORLD_BGM_KEY_BY_TIME[timeOfDay];

  if (!scene.cache.audio.exists(bgmKey)) {
    console.warn(`[BGM] 아직 로드되지 않은 world BGM: ${bgmKey}`);
    return;
  }

  const existing = scene.sound.get(bgmKey);
  if (existing) {
    audioManager.registerManagedSound(existing, "bgm", 0.5);
    audioManager.updateManagedSoundVolume(existing, "bgm", 0.5);
    if (existing.isPlaying) {
      return;
    }
  }

  await resumeAudioContext(scene);
  audioManager.stopManagedSounds("bgm", { scene, exceptKey: bgmKey });
  if (existing) {
    existing.play();
    return;
  }

  const bgm = audioManager.add(scene, bgmKey, "bgm", { loop: true, volume: 0.5 });
  bgm?.play();
}

export function getPlaceBackgroundTextureKey(placeId: PlaceId): string | null {
  return PLACE_BACKGROUND_KEY_BY_PLACE_ID[placeId] ?? null;
}

export function ensurePlaceBackgroundTexture(
  scene: Phaser.Scene,
  placeId: PlaceId,
  audioManager: AudioManager,
  onReady: (textureKey: string | null) => void,
): void {
  const textureKey = getPlaceBackgroundTextureKey(placeId);
  const bgmKey = PLACE_BGM_KEY_BY_PLACE_ID[placeId];

  if (!textureKey) {
    if (bgmKey && scene.cache.audio.exists(bgmKey)) {
      void playPlaceBgm(scene, placeId, audioManager);
    }
    onReady(null);
    return;
  }

  const isTextureLoaded = scene.textures.exists(textureKey);
  const isAudioLoaded = bgmKey ? scene.cache.audio.exists(bgmKey) : true;

  if (isTextureLoaded && isAudioLoaded) {
    void playPlaceBgm(scene, placeId, audioManager);
    onReady(textureKey);
    return;
  }

  const assetPath = PLACE_BACKGROUND_ASSET_BY_KEY.get(textureKey);
  if (!isTextureLoaded && assetPath) {
    scene.load.image(textureKey, assetPath);
  }

  if (bgmKey && !isAudioLoaded) {
    const bgmAsset = PLACE_BGM_ASSETS.find((a) => a.key === bgmKey);
    if (bgmAsset) {
      scene.load.audio(bgmKey, bgmAsset.path);
    }
  }

  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    void playPlaceBgm(scene, placeId, audioManager);
    onReady(textureKey);
  });

  if (!scene.load.isLoading()) {
    scene.load.start();
  }
}

export function createPlaceBackgroundImage(
  scene: Phaser.Scene,
  textureKey: string | null
): Phaser.GameObjects.Image | null {
  if (!textureKey || !scene.textures.exists(textureKey)) {
    return null;
  }

  return scene.add
    .image(scene.scale.width / 2, scene.scale.height / 2, textureKey)
    .setDisplaySize(scene.scale.width, scene.scale.height)
    .setScrollFactor(0);
}


export function createSkyBackground(
  scene: Phaser.Scene,
  timeOfDay: TimeOfDay,
  mapWidth?: number,
  mapHeight?: number,
  depth: number = -10
): () => void {
  const skyKey = getSkyBackgroundKey(timeOfDay);
  const [cloudKey1, cloudKey2] = getCloudKeys(timeOfDay);

  const w = scene.scale.width;
  const h = scene.scale.height;

  const skyWidth = w;
  const skyHeight = mapHeight ? Math.min(mapHeight, h) : h;

  const skyBg = scene.add
    .image(w / 2, skyHeight / 2, skyKey)
    .setDisplaySize(skyWidth, skyHeight)
    .setScrollFactor(0)
    .setDepth(depth);

  const CLOUD_SPEED = 50;
  const skyLeft = 0;
  const skyRight = w;

  const cloudYMin = skyHeight * 0.01;
  const cloudYMax = skyHeight * 0.2;

  const randomCloudY = () => Phaser.Math.Between(cloudYMin, cloudYMax);

  const cloud1 = scene.add
    .image(-200, randomCloudY(), cloudKey1)
    .setScrollFactor(0)
    .setDepth(depth + 1)
    .setAlpha(0.85);

  const cloud2 = scene.add
    .image(w * 0.4, randomCloudY(), cloudKey2)
    .setScrollFactor(0)
    .setDepth(depth + 1)
    .setAlpha(0.85);

  const onUpdate = (_scene: Phaser.Scene, delta: number) => {
    const move = (CLOUD_SPEED * delta) / 1000;

    cloud1.x += move;
    cloud2.x += move;

    const c1HalfW = cloud1.displayWidth / 2;
    const c2HalfW = cloud2.displayWidth / 2;

    if (cloud1.x - c1HalfW > skyRight) {
      cloud1.x = skyLeft - c1HalfW;
      cloud1.y = randomCloudY();
    }

    if (cloud2.x - c2HalfW > skyRight) {
      cloud2.x = skyLeft - c2HalfW;
      cloud2.y = randomCloudY();
    }

    if (cloud1.x + c1HalfW < skyLeft) cloud1.x = skyLeft - c1HalfW;
    if (cloud2.x + c2HalfW < skyLeft) cloud2.x = skyLeft - c2HalfW;

    cloud1.y = Phaser.Math.Clamp(cloud1.y, cloudYMin, cloudYMax);
    cloud2.y = Phaser.Math.Clamp(cloud2.y, cloudYMin, cloudYMax);
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  return () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    skyBg.destroy();
    cloud1.destroy();
    cloud2.destroy();
  };
}
