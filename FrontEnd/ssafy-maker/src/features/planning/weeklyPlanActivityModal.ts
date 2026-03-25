import Phaser from "phaser";
import { UI_DEPTH } from "../../game/systems/uiDepth";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export function createWeeklyPlanActivityModal(
  scene: Phaser.Scene,
  options: {
    title: string;
    statusText: string;
    description: string;
    accentColor: number;
  }
): Phaser.GameObjects.Container {
  const { title, statusText, description, accentColor } = options;
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const root = scene.add.container(0, 0).setDepth(UI_DEPTH.plannerActivity).setScrollFactor(0);

  const overlay = scene.add
    .rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.54)
    .setScrollFactor(0);
  overlay.setInteractive();

  const panelOuter = scene.add
    .rectangle(centerX, centerY, 546, 308, 0x000000, 0)
    .setScrollFactor(0);
  panelOuter.setStrokeStyle(2, 0x3b6a92, 1);

  const panel = scene.add
    .rectangle(centerX, centerY, 536, 298, 0x14314f, 0.97)
    .setScrollFactor(0);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);

  const accentBar = scene.add
    .rectangle(centerX, centerY - 114, 404, 14, accentColor, 1)
    .setScrollFactor(0);

  const titleText = scene.add.text(centerX, centerY - 148, title, {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#a9d0f4",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  const statusBadge = scene.add
    .rectangle(centerX, centerY - 34, 386, 54, accentColor, 0.94)
    .setScrollFactor(0);
  statusBadge.setStrokeStyle(2, 0xeef7ff, 0.9);

  const status = scene.add.text(centerX, centerY - 35, statusText, {
    fontFamily: FONT_FAMILY,
    fontSize: "28px",
    fontStyle: "bold",
    color: "#f4fbff",
    resolution: 2,
    align: "center",
    wordWrap: { width: 350 }
  }).setOrigin(0.5).setScrollFactor(0);

  const descriptionText = scene.add.text(centerX, centerY + 46, description, {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#d9ebff",
    resolution: 2,
    align: "center",
    wordWrap: { width: 396 }
  }).setOrigin(0.5).setScrollFactor(0);

  const hint = scene.add.text(centerX, centerY + 104, "잠시 후 자동으로 다음 시간대로 이동합니다", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    fontStyle: "bold",
    color: "#90b3d4",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  root.add([overlay, panelOuter, panel, accentBar, titleText, statusBadge, status, descriptionText, hint]);
  return root;
}
