import Phaser from "phaser";

export type BaseButtonOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
};

export function createBaseButton(scene: Phaser.Scene, options: BaseButtonOptions): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(options.x, options.y, options.width, options.height, 0xc8b084, 1);
  bg.setStrokeStyle(2, 0x8f6c3c, 1);
  const label = scene.add.text(options.x - options.width * 0.28, options.y - 12, options.text, {
    color: "#3e2d1a",
    fontSize: "22px"
  });

  bg.setInteractive({ useHandCursor: true }).on("pointerdown", options.onClick);
  return scene.add.container(0, 0, [bg, label]);
}

