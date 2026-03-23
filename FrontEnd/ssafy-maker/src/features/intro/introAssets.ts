import Phaser from "phaser";
import { buildGameAssetPath } from "@shared/assets/gameAssetPath";

export const INTRO_FONT_FAMILY = "PFStardustBold";

export const INTRO_AUDIO_KEYS = {
  typeSound: "type_sound",
  streetBgm: "street_bgm",
  subwayArrival: "subway_arrival",
  subwayTrain: "subway_train_snd",
  doorOpen: "door_open_snd",
  crowded: "crowded_snd",
  roomtone: "roomtone",
  voiceMale: "voice_male",
  voiceFemale: "voice_female",
  panic: "panic_snd",
  click: "click_snd",
  thump: "thump_snd",
  victoryBgm: "victory_bgm"
} as const;

export const INTRO_IMAGE_KEYS = {
  subwayBg: "subway_bg",
  subwayTrain: "subway_train_img",
  subwayTrainOpen: "subway_train_open",
  subwayFg: "subway_fg",
  crowd1: "crowd1",
  crowd2: "crowd2",
  crowd3: "crowd3",
  yeoksamOutside: "yeoksam_outside",
  yeoksamInside: "yeoksam_inside",
  yeoksamInterview: "yeoksam3",
  passScreen: "pass_screen",
  passScreenReveal: "pass_screen2",
  victoryBg: "victory_bg"
} as const;

const INTRO_AUDIO_ASSETS = [
  { key: INTRO_AUDIO_KEYS.typeSound, path: buildGameAssetPath("audio", "SoundEffect", "type.mp3") },
  { key: INTRO_AUDIO_KEYS.streetBgm, path: buildGameAssetPath("audio", "BGM", "survive.mp3") },
  { key: INTRO_AUDIO_KEYS.subwayArrival, path: buildGameAssetPath("audio", "SoundEffect", "subway_come.mp3") },
  { key: INTRO_AUDIO_KEYS.subwayTrain, path: buildGameAssetPath("audio", "SoundEffect", "train.mp3") },
  { key: INTRO_AUDIO_KEYS.doorOpen, path: buildGameAssetPath("audio", "SoundEffect", "door_open.mp3") },
  { key: INTRO_AUDIO_KEYS.crowded, path: buildGameAssetPath("audio", "SoundEffect", "crowded.mp3") },
  { key: INTRO_AUDIO_KEYS.roomtone, path: buildGameAssetPath("audio", "BGM", "roomtone.mp3") },
  { key: INTRO_AUDIO_KEYS.voiceMale, path: buildGameAssetPath("audio", "SoundEffect", "voice_male.wav") },
  { key: INTRO_AUDIO_KEYS.voiceFemale, path: buildGameAssetPath("audio", "SoundEffect", "voice_female.wav") },
  { key: INTRO_AUDIO_KEYS.panic, path: buildGameAssetPath("audio", "SoundEffect", "no.mp3") },
  { key: INTRO_AUDIO_KEYS.click, path: buildGameAssetPath("audio", "SoundEffect", "click2.mp3") },
  { key: INTRO_AUDIO_KEYS.thump, path: buildGameAssetPath("audio", "SoundEffect", "no.mp3") },
  { key: INTRO_AUDIO_KEYS.victoryBgm, path: buildGameAssetPath("audio", "BGM", "Event2.mp3") }
] as const;

const INTRO_IMAGE_ASSETS = [
  { key: INTRO_IMAGE_KEYS.subwayBg, path: buildGameAssetPath("backgrounds", "subway_back.png") },
  { key: INTRO_IMAGE_KEYS.subwayTrain, path: buildGameAssetPath("backgrounds", "train.png") },
  { key: INTRO_IMAGE_KEYS.subwayTrainOpen, path: buildGameAssetPath("backgrounds", "train_open.png") },
  { key: INTRO_IMAGE_KEYS.subwayFg, path: buildGameAssetPath("backgrounds", "subway_front.png") },
  { key: INTRO_IMAGE_KEYS.crowd1, path: buildGameAssetPath("backgrounds", "crowd1.png") },
  { key: INTRO_IMAGE_KEYS.crowd2, path: buildGameAssetPath("backgrounds", "crowd2.png") },
  { key: INTRO_IMAGE_KEYS.crowd3, path: buildGameAssetPath("backgrounds", "crowd3.png") },
  { key: INTRO_IMAGE_KEYS.yeoksamOutside, path: buildGameAssetPath("backgrounds", "yeoksam.png") },
  { key: INTRO_IMAGE_KEYS.yeoksamInside, path: buildGameAssetPath("backgrounds", "yeoksam2.png") },
  { key: INTRO_IMAGE_KEYS.yeoksamInterview, path: buildGameAssetPath("backgrounds", "yeoksam3.png") },
  { key: INTRO_IMAGE_KEYS.passScreen, path: buildGameAssetPath("backgrounds", "pass_SF.png") },
  { key: INTRO_IMAGE_KEYS.passScreenReveal, path: buildGameAssetPath("backgrounds", "pass_SF2.png") },
  { key: INTRO_IMAGE_KEYS.victoryBg, path: buildGameAssetPath("backgrounds", "pass_SF2.png") }
] as const;

export function preloadIntroAssets(scene: Phaser.Scene): void {
  INTRO_AUDIO_ASSETS.forEach((asset) => {
    scene.load.audio(asset.key, asset.path);
  });

  INTRO_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}
