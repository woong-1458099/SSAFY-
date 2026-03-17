import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { createPanelOuterBorder } from "@features/ui/components/uiPrimitives";
import { HOME_ACTION_LABELS, type HomeActionId } from "@features/home/homeActions";

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

export function createHomeActionModal(params: {
  scene: Phaser.Scene;
  actionPoint: number;
  maxActionPoint: number;
  backgroundImage: Phaser.GameObjects.Image | null;
  getBodyStyle: BodyStyleFn;
  createActionButton: ActionButtonFn;
  uiPanelInnerBorderColor: number;
  uiPanelOuterBorderColor: number;
  onAction: (action: HomeActionId) => void;
  onClose: () => void;
}): Phaser.GameObjects.Container {
  const {
    scene,
    actionPoint,
    maxActionPoint,
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
  const panelOuter = createPanelOuterBorder(scene, centerX, centerY, 560, 460);
  panelOuter.setStrokeStyle(3, uiPanelOuterBorderColor, 1);
  const panel = scene.add.rectangle(centerX, centerY, 560, 460, 0x1a375c, 0.95);
  panel.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
  const title = scene.add.text(centerX, centerY - 190, "집 행동", getBodyStyle(34, "#e6f3ff", "bold"));
  title.setOrigin(0.5);
  const apText = scene.add.text(
    centerX,
    centerY - 146,
    `남은 행동력: ${actionPoint}/${maxActionPoint}`,
    getBodyStyle(21, "#b6d6fb", "bold")
  );
  apText.setOrigin(0.5);

  const sleepBtn = createActionButton({
    x: centerX,
    y: centerY - 54,
    width: 390,
    height: 66,
    text: HOME_ACTION_LABELS.sleep,
    onClick: () => onAction("sleep"),
  });
  const studyBtn = createActionButton({
    x: centerX,
    y: centerY + 32,
    width: 390,
    height: 66,
    text: HOME_ACTION_LABELS.study,
    onClick: () => onAction("study"),
  });
  const gameBtn = createActionButton({
    x: centerX,
    y: centerY + 118,
    width: 390,
    height: 66,
    text: HOME_ACTION_LABELS.game,
    onClick: () => onAction("game"),
  });
  const closeBtn = createActionButton({
    x: centerX,
    y: centerY + 196,
    width: 210,
    height: 52,
    text: "닫기",
    onClick: onClose,
  });

  const objects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, title, apText, sleepBtn, studyBtn, gameBtn, closeBtn];
  if (backgroundImage) {
    objects.unshift(backgroundImage);
  }

  return scene.add.container(0, 0, objects);
}
