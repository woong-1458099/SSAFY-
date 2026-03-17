import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { createPanelOuterBorder } from "@features/ui/components/uiPrimitives";

type BodyStyleFn = (
  sizePx: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

type ActionButtonFn = (options: {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
}) => Phaser.GameObjects.Container;

export function createPlaceActionModal(params: {
  scene: Phaser.Scene;
  width: number;
  height: number;
  title: string;
  description: string;
  actionText: string;
  showCloseButton?: boolean;
  backgroundImage: Phaser.GameObjects.Image | null;
  getBodyStyle: BodyStyleFn;
  createActionButton: ActionButtonFn;
  uiPanelInnerBorderColor: number;
  uiPanelOuterBorderColor: number;
  onAction: () => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const {
    scene,
    width,
    height,
    title,
    description,
    actionText,
    showCloseButton = true,
    backgroundImage,
    getBodyStyle,
    createActionButton,
    uiPanelInnerBorderColor,
    uiPanelOuterBorderColor,
    onAction,
    onClose,
  } = params;

  const centerX = Math.round(GAME_CONSTANTS.WIDTH / 2);
  const centerY = Math.round(GAME_CONSTANTS.HEIGHT / 2);
  const overlay = scene.add.rectangle(
    centerX,
    centerY,
    GAME_CONSTANTS.WIDTH,
    GAME_CONSTANTS.HEIGHT,
    0x000000,
    backgroundImage ? 0.42 : 0.36
  );
  const panelOuter = createPanelOuterBorder(scene, centerX, centerY, width, height);
  panelOuter.setStrokeStyle(3, uiPanelOuterBorderColor, 1);
  const panel = scene.add.rectangle(centerX, centerY, width, height, 0x1a375c, 0.95);
  panel.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
  const titleText = scene.add.text(centerX, centerY - 90, title, getBodyStyle(34, "#e6f3ff", "bold"));
  titleText.setOrigin(0.5);
  const descText = scene.add.text(centerX, centerY - 12, description, getBodyStyle(21, "#b6d6fb"));
  descText.setOrigin(0.5);
  descText.setAlign("center");
  descText.setLineSpacing(8);

  const actionBtn = createActionButton({
    x: showCloseButton ? centerX - 96 : centerX,
    y: centerY + 92,
    width: 170,
    height: 52,
    text: actionText,
    onClick: onAction,
  });

  const objects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, titleText, descText, actionBtn];
  if (showCloseButton) {
    const closeBtn = createActionButton({
      x: centerX + 96,
      y: centerY + 92,
      width: 170,
      height: 52,
      text: "닫기",
      onClick: onClose,
    });
    objects.push(closeBtn);
  }

  if (backgroundImage) {
    objects.unshift(backgroundImage);
  }

  return scene.add.container(0, 0, objects);
}
