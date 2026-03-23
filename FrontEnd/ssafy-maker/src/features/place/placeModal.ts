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

export function createPlaceActionModal(scene: Phaser.Scene, options: {
  title: string;
  description: string;
  actionText: string;
  showCloseButton?: boolean;
  backgroundImage?: Phaser.GameObjects.Image | null;
  createButton: ButtonFactory;
  onAction: () => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const overlay = scene.add.rectangle(
    centerX,
    centerY,
    scene.scale.width,
    scene.scale.height,
    0x04101d,
    options.backgroundImage ? 0.24 : 0.58
  );
  const panel = scene.add.rectangle(centerX, centerY, 560, 300, 0x14314f, options.backgroundImage ? 0.88 : 0.98);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);
  const title = scene.add.text(centerX, centerY - 88, options.title, {
    fontFamily: FONT_FAMILY,
    fontSize: "32px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5);
  const body = scene.add.text(centerX, centerY - 6, options.description, {
    fontFamily: FONT_FAMILY,
    fontSize: "20px",
    color: "#b8d8f7",
    resolution: 2,
    align: "center",
    lineSpacing: 8
  }).setOrigin(0.5);
  body.setAlign("center");

  const actionButton = options.createButton({
    x: options.showCloseButton === false ? centerX : centerX - 96,
    y: centerY + 92,
    width: 176,
    height: 54,
    text: options.actionText,
    onClick: options.onAction
  });

  const objects: Phaser.GameObjects.GameObject[] = [overlay, panel, title, body, actionButton];

  if (options.showCloseButton !== false) {
    objects.push(
      options.createButton({
        x: centerX + 96,
        y: centerY + 92,
        width: 176,
        height: 54,
        text: "닫기",
        onClick: options.onClose
      })
    );
  }

  if (options.backgroundImage) {
    options.backgroundImage.setAlpha(0.98);
    objects.unshift(options.backgroundImage);
  }

  return scene.add.container(0, 0, objects);
}
