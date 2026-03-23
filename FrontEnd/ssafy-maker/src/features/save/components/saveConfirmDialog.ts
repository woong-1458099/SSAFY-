import Phaser from "phaser";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

type ButtonFactory = (params: {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
}) => Phaser.GameObjects.Container;

export function createSaveConfirmDialog(scene: Phaser.Scene, options: {
  title: string;
  body: string;
  confirmText: string;
  cancelText?: string;
  createActionButton: ButtonFactory;
  onConfirm: () => void;
  onCancel: () => void;
}): Phaser.GameObjects.Container {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);

  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x02060d, 0.45);
  const outer = scene.add.rectangle(centerX, centerY, 420, 214, 0x05111f, 0.9);
  outer.setStrokeStyle(2, 0x7dc9ff, 1);
  const panel = scene.add.rectangle(centerX, centerY, 410, 204, 0x14314f, 0.96);
  panel.setStrokeStyle(2, 0x4f98df, 1);

  const title = scene.add.text(centerX, centerY - 72, options.title, {
    fontFamily: FONT_FAMILY,
    fontSize: "22px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  });
  title.setOrigin(0.5);

  const body = scene.add.text(centerX, centerY - 16, options.body, {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#b7d7f5",
    resolution: 2,
    align: "center",
    wordWrap: { width: 320 }
  });
  body.setOrigin(0.5);

  const confirmButton = options.createActionButton({
    x: centerX - 86,
    y: centerY + 62,
    width: 144,
    height: 42,
    text: options.confirmText,
    onClick: options.onConfirm
  });
  const cancelButton = options.createActionButton({
    x: centerX + 86,
    y: centerY + 62,
    width: 144,
    height: 42,
    text: options.cancelText ?? "취소",
    onClick: options.onCancel
  });

  return scene.add.container(0, 0, [overlay, outer, panel, title, body, confirmButton, cancelButton]);
}
