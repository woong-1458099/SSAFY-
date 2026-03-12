import Phaser from "phaser";

export type BaseModal = {
  root: Phaser.GameObjects.Container;
  setVisible: (visible: boolean) => void;
};

export function createBaseModal(scene: Phaser.Scene, width: number, height: number): BaseModal {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);

  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x000000, 0.45);
  const panel = scene.add.rectangle(centerX, centerY, width, height, 0x1a3558, 1);
  panel.setStrokeStyle(3, 0x64b2ff, 1);
  const root = scene.add.container(0, 0, [overlay, panel]);

  return {
    root,
    setVisible: (visible: boolean) => root.setVisible(visible)
  };
}
