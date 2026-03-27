import Phaser from "phaser";
import { HOME_ACTION_LABELS, type HomeActionId } from "./homeActions";

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

export function createHomeActionModal(scene: Phaser.Scene, options: {
  actionPoint: number;
  maxActionPoint: number;
  backgroundImage?: Phaser.GameObjects.Image | null;
  createButton: ButtonFactory;
  onAction: (action: HomeActionId) => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.58);
  const panel = scene.add.rectangle(centerX, centerY, 640, 560, 0x14314f, 0.98);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);
  const title = scene.add.text(centerX, centerY - 210, "집 행동", {
    fontFamily: FONT_FAMILY,
    fontSize: "34px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5);
  const apText = scene.add.text(centerX, centerY - 168, `행동력 ${options.actionPoint}/${options.maxActionPoint}`, {
    fontFamily: FONT_FAMILY,
    fontSize: "20px",
    fontStyle: "bold",
    color: "#9fcdf5",
    resolution: 2
  }).setOrigin(0.5);

  const sleepButton = options.createButton({
    x: centerX,
    y: centerY - 88,
    width: 430,
    height: 66,
    text: HOME_ACTION_LABELS.sleep,
    onClick: () => options.onAction("sleep")
  });
  const frontendStudyButton = options.createButton({
    x: centerX,
    y: centerY - 4,
    width: 430,
    height: 66,
    text: HOME_ACTION_LABELS.frontendStudy,
    onClick: () => options.onAction("frontendStudy")
  });
  const backendStudyButton = options.createButton({
    x: centerX,
    y: centerY + 80,
    width: 430,
    height: 66,
    text: HOME_ACTION_LABELS.backendStudy,
    onClick: () => options.onAction("backendStudy")
  });
  const gameButton = options.createButton({
    x: centerX,
    y: centerY + 164,
    width: 430,
    height: 66,
    text: HOME_ACTION_LABELS.game,
    onClick: () => options.onAction("game")
  });
  const closeButton = options.createButton({
    x: centerX,
    y: centerY + 248,
    width: 220,
    height: 52,
    text: "닫기",
    onClick: options.onClose
  });

  const objects: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    title,
    apText,
    sleepButton,
    frontendStudyButton,
    backendStudyButton,
    gameButton,
    closeButton
  ];

  if (options.backgroundImage) {
    objects.unshift(options.backgroundImage);
  }

  return scene.add.container(0, 0, objects);
}
