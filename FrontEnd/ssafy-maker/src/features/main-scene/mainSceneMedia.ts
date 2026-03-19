import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { AudioManager, type AudioCategory } from "@core/managers/AudioManager";
import type { AreaId } from "@features/main-scene/areas/areaSceneConfig";
import { PLACE_BACKGROUND_KEYS } from "@shared/constants/placeBackgroundKeys";

export const MAIN_SCENE_BACKGROUND_ASSETS = [
  { key: PLACE_BACKGROUND_KEYS.cafe, path: "assets/game/backgrounds/cafe.png" },
  { key: PLACE_BACKGROUND_KEYS.store, path: "assets/game/backgrounds/conv.png" },
  { key: PLACE_BACKGROUND_KEYS.home, path: "assets/game/backgrounds/myroom.png" },
  { key: PLACE_BACKGROUND_KEYS.gym, path: "assets/game/backgrounds/gym.png" },
  { key: PLACE_BACKGROUND_KEYS.ramenthings, path: "assets/game/backgrounds/ramenthings.png" },
  { key: PLACE_BACKGROUND_KEYS.karaoke, path: "assets/game/backgrounds/singroom.png" },
  { key: PLACE_BACKGROUND_KEYS.lottery, path: "assets/game/backgrounds/lotto.png" },
  { key: PLACE_BACKGROUND_KEYS.hof, path: "assets/game/backgrounds/hoff.png" }
] as const;

export function preloadMainSceneBackgroundAssets(scene: Phaser.Scene): void {
  MAIN_SCENE_BACKGROUND_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

export const MAIN_SCENE_BGM_ASSETS: Array<{ key: string; path: string }> = [
  // Example BGM assets. Add real files here when the team is ready.
  // { key: "mainscene-bgm-world", path: "assets/game/audio/bgm/main-world.mp3" },
  // { key: "mainscene-bgm-downtown", path: "assets/game/audio/bgm/main-downtown.mp3" },
  // { key: "mainscene-bgm-campus", path: "assets/game/audio/bgm/main-campus.mp3" }
];

export const MAIN_SCENE_AREA_BGM_KEYS: Partial<Record<AreaId, string>> = {
  // Whole map / overview map
  world: "mainscene-bgm-world",
  // Downtown map
  downtown: "mainscene-bgm-downtown",
  // Campus map
  campus: "mainscene-bgm-campus"
};

export function preloadMainSceneAudioAssets(scene: Phaser.Scene): void {
  MAIN_SCENE_BGM_ASSETS.forEach((asset) => {
    scene.load.audio(asset.key, asset.path);
  });
}

export function createMainSceneBackgroundImage(
  scene: Phaser.Scene,
  px: (value: number) => number,
  textureKey: string | null,
  displaySize = true
): Phaser.GameObjects.Image | null {
  if (!textureKey || !scene.textures.exists(textureKey)) {
    return null;
  }

  const image = scene.add.image(px(GAME_CONSTANTS.WIDTH / 2), px(GAME_CONSTANTS.HEIGHT / 2), textureKey);
  if (displaySize) {
    image.setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);
  }
  return image;
}

export function applyMainSceneBackgroundTexture(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image | undefined,
  textureKey: string | null
): boolean {
  if (!image) {
    return false;
  }

  if (textureKey && scene.textures.exists(textureKey)) {
    image.setTexture(textureKey);
    image.setDisplaySize(GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT);
    image.setVisible(true);
    return true;
  }

  image.setVisible(false);
  return false;
}

export type MainSceneAreaBgmSyncParams = {
  scene: Phaser.Scene;
  audioManager: AudioManager;
  currentBgm?: Phaser.Sound.BaseSound;
  area: AreaId;
  baseVolume?: number;
};

export function resolveMainSceneAreaBgmKey(area: AreaId): string | null {
  return MAIN_SCENE_AREA_BGM_KEYS[area] ?? null;
}

export function syncMainSceneAreaBgm({
  scene,
  audioManager,
  currentBgm,
  area,
  baseVolume = 0.5
}: MainSceneAreaBgmSyncParams): Phaser.Sound.BaseSound | undefined {
  const nextKey = resolveMainSceneAreaBgmKey(area);

  if (!nextKey) {
    destroyMainSceneLoopSound(currentBgm);
    return undefined;
  }

  if (currentBgm?.key === nextKey) {
    return currentBgm;
  }

  destroyMainSceneLoopSound(currentBgm);

  const nextBgm = audioManager.add(scene, nextKey, "bgm", {
    loop: true,
    volume: baseVolume
  });

  if (!nextBgm) {
    console.warn(`[MainSceneMedia] Missing BGM asset for area "${area}" with key "${nextKey}"`);
    return undefined;
  }

  nextBgm.play();
  return nextBgm;
}

export function destroyMainSceneLoopSound(sound?: Phaser.Sound.BaseSound): void {
  if (!sound) {
    return;
  }

  sound.stop();
  sound.destroy();
}

export type MainSceneAudioSettingsBindings = {
  getVolumes: () => ReturnType<AudioManager["getVolumes"]>;
  setVolume: (key: AudioCategory, value: number) => void;
};

export function createMainSceneAudioSettingsBindings(audioManager: AudioManager): MainSceneAudioSettingsBindings {
  return {
    getVolumes: () => audioManager.getVolumes(),
    setVolume: (key, value) => {
      if (key === "bgm") audioManager.setBgmVolume(value);
      if (key === "sfx") audioManager.setSfxVolume(value);
      if (key === "ambience") audioManager.setAmbienceVolume(value);
    }
  };
}
