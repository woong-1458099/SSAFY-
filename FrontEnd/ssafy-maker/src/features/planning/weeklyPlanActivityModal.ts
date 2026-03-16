import Phaser from "phaser";
import { createPanelOuterBorder } from "@features/ui/components/uiPrimitives";

type TextStyleFactory = (
  size: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

export function createWeeklyPlanActivityModal(scene: Phaser.Scene, options: {
  title: string;
  statusText: string;
  description: string;
  accentColor: number;
  backgroundImage?: Phaser.GameObjects.Image | null;
  getBodyStyle: TextStyleFactory;
  uiPanelInnerBorderColor: number;
  uiPanelOuterBorderColor: number;
}): Phaser.GameObjects.Container {
  const {
    title,
    statusText,
    description,
    accentColor,
    backgroundImage,
    getBodyStyle,
    uiPanelInnerBorderColor,
    uiPanelOuterBorderColor
  } = options;

  const width = 560;
  const height = 360;
  const centerX = 640;
  const centerY = 360;

  const overlay = scene.add.rectangle(centerX, centerY, 1280, 720, 0x000000, 0.58);
  const panelOuter = createPanelOuterBorder(scene, centerX, centerY, width, height);
  panelOuter.setStrokeStyle(6, uiPanelOuterBorderColor, 1);

  const panel = scene.add.rectangle(centerX, centerY, width, height, 0x10263f, 0.96);
  panel.setStrokeStyle(2, uiPanelInnerBorderColor, 1);

  const imageFrame = scene.add.rectangle(centerX, centerY - 56, 460, 176, 0x19324f, 1);
  imageFrame.setStrokeStyle(2, accentColor, 1);
  const imageShade = scene.add.rectangle(centerX, centerY - 56, 460, 176, accentColor, 0.16);

  if (backgroundImage) {
    backgroundImage.setPosition(centerX, centerY - 56);
    backgroundImage.setDisplaySize(452, 168);
    backgroundImage.setAlpha(0.88);
  }

  const badge = scene.add.rectangle(centerX, centerY - 152, 188, 30, accentColor, 1);
  badge.setStrokeStyle(2, 0xe8f3ff, 0.9);
  const badgeText = scene.add.text(centerX, centerY - 152, title, getBodyStyle(15, "#f4fbff", "bold"));
  badgeText.setOrigin(0.5);

  const status = scene.add.text(centerX, centerY + 70, statusText, getBodyStyle(28, "#f0f7ff", "bold"));
  status.setOrigin(0.5);

  const body = scene.add.text(centerX, centerY + 118, description, getBodyStyle(18, "#c8dbef"));
  body.setOrigin(0.5);

  const hint = scene.add.text(centerX, centerY + 154, "일정 진행 후 다음 시간대로 이동합니다", getBodyStyle(15, "#90b3d4"));
  hint.setOrigin(0.5);

  const objects: Phaser.GameObjects.GameObject[] = [
    overlay,
    panelOuter,
    panel,
    imageFrame,
    ...(backgroundImage ? [backgroundImage] : []),
    imageShade,
    badge,
    badgeText,
    status,
    body,
    hint
  ];

  const root = scene.add.container(0, 0, objects);
  root.setDepth(1300);
  return root;
}
