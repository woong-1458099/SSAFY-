import Phaser from "phaser";

export const UI_PANEL_INNER_BORDER_COLOR = 0x6098c2;
export const UI_PANEL_OUTER_BORDER_COLOR = 0x1e3c6e;

export type PanelActionButtonOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  textStyle: Phaser.Types.GameObjects.Text.TextStyle;
  onClick: () => void;
};

export function createPanelActionButton(
  scene: Phaser.Scene,
  options: PanelActionButtonOptions
): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(options.x, options.y, options.width, options.height, 0x2f5684, 1);
  bg.setStrokeStyle(2, 0x71c0ff, 1);

  const label = scene.add.text(options.x, options.y, options.text, options.textStyle);
  label.setOrigin(0.5);

  bg.setInteractive({ useHandCursor: true });
  bg.on("pointerdown", options.onClick);
  bg.on("pointerover", () => bg.setFillStyle(0x3a699f, 1));
  bg.on("pointerout", () => bg.setFillStyle(0x2f5684, 1));

  return scene.add.container(0, 0, [bg, label]);
}

export function createPanelCloseButton(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  panelWidth: number,
  panelHeight: number,
  onClick: () => void
): Phaser.GameObjects.Container {
  const buttonSize = 34;
  const x = Math.round(centerX + panelWidth / 2 - buttonSize / 2 - 14);
  const y = Math.round(centerY - panelHeight / 2 + buttonSize / 2 + 14);
  const bg = scene.add.rectangle(x, y, buttonSize, buttonSize, 0x244c79, 0.96);
  bg.setStrokeStyle(2, 0x79c7ff, 1);

  const lineA = scene.add.rectangle(x, y, 18, 3, 0xe9f5ff, 1);
  lineA.setAngle(45);
  const lineB = scene.add.rectangle(x, y, 18, 3, 0xe9f5ff, 1);
  lineB.setAngle(-45);

  bg.setInteractive({ useHandCursor: true });
  bg.on("pointerdown", onClick);
  bg.on("pointerover", () => bg.setFillStyle(0x2f649b, 0.98));
  bg.on("pointerout", () => bg.setFillStyle(0x244c79, 0.96));

  return scene.add.container(0, 0, [bg, lineA, lineB]);
}

export function createPanelOuterBorder(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  panelWidth: number,
  panelHeight: number
): Phaser.GameObjects.Rectangle {
  const outer = scene.add.rectangle(centerX, centerY, panelWidth + 8, panelHeight + 8, 0x000000, 0);
  outer.setStrokeStyle(3, UI_PANEL_OUTER_BORDER_COLOR, 1);
  return outer;
}
