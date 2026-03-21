import Phaser from 'phaser';

export const LEGACY_MINIGAME_WIDTH = 800;
export const LEGACY_MINIGAME_HEIGHT = 600;

export function applyLegacyViewport(scene: Phaser.Scene): void {
  const offsetX = Math.max(0, Math.round((scene.scale.width - LEGACY_MINIGAME_WIDTH) / 2));
  const offsetY = Math.max(0, Math.round((scene.scale.height - LEGACY_MINIGAME_HEIGHT) / 2));
  scene.cameras.main.setViewport(offsetX, offsetY, LEGACY_MINIGAME_WIDTH, LEGACY_MINIGAME_HEIGHT);
  scene.cameras.main.setBounds(0, 0, LEGACY_MINIGAME_WIDTH, LEGACY_MINIGAME_HEIGHT);
}

