import Phaser from "phaser";
import { UI_DEPTH } from "../../game/systems/uiDepth";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

const PANEL_OUTER_WIDTH = 556;
const PANEL_OUTER_HEIGHT = 560;
const PANEL_WIDTH = 546;
const PANEL_HEIGHT = 550;
const PREVIEW_OUTER_WIDTH = 392;
const PREVIEW_OUTER_HEIGHT = 276;
const PREVIEW_FRAME_WIDTH = 382;
const PREVIEW_FRAME_HEIGHT = 266;
const PREVIEW_IMAGE_MAX_WIDTH = 354;
const PREVIEW_IMAGE_MAX_HEIGHT = 236;

export function createWeeklyPlanActivityModal(
  scene: Phaser.Scene,
  options: {
    title: string;
    statusText: string;
    description: string;
    accentColor: number;
    imageKey?: string;
    onClose: () => void;
  }
): Phaser.GameObjects.Container {
  const { title, statusText, description, accentColor, imageKey, onClose } = options;
  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const root = scene.add.container(0, 0).setDepth(UI_DEPTH.plannerActivity).setScrollFactor(0);

  const overlay = scene.add
    .rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.54)
    .setScrollFactor(0);
  overlay.setInteractive();

  const panelOuter = scene.add
    .rectangle(centerX, centerY, PANEL_OUTER_WIDTH, PANEL_OUTER_HEIGHT, 0x000000, 0)
    .setScrollFactor(0);
  panelOuter.setStrokeStyle(2, 0x3b6a92, 1);

  const panel = scene.add
    .rectangle(centerX, centerY, PANEL_WIDTH, PANEL_HEIGHT, 0x14314f, 0.97)
    .setScrollFactor(0);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);

  const accentBar = scene.add
    .rectangle(centerX, centerY - 236, 404, 8, accentColor, 1)
    .setScrollFactor(0);

  const titleText = scene.add.text(centerX, centerY - 252, title, {
    fontFamily: FONT_FAMILY,
    fontSize: "24px",
    fontStyle: "bold",
    color: "#a9d0f4",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  const previewOuter = scene.add
    .rectangle(centerX, centerY - 82, PREVIEW_OUTER_WIDTH, PREVIEW_OUTER_HEIGHT, 0x000000, 0)
    .setScrollFactor(0);
  previewOuter.setStrokeStyle(2, 0x3b6a92, 1);

  const previewFrame = scene.add
    .rectangle(centerX, centerY - 82, PREVIEW_FRAME_WIDTH, PREVIEW_FRAME_HEIGHT, 0x112942, 0.98)
    .setScrollFactor(0);
  previewFrame.setStrokeStyle(2, 0x8ed2ff, 1);

  const previewAccent = scene.add
    .rectangle(centerX, centerY - 203, 352, 20, accentColor, 0.92)
    .setScrollFactor(0);

  const previewLabel = scene.add.text(centerX, centerY - 203, "이번 시간 활동", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    fontStyle: "bold",
    color: "#f4fbff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  const previewImage = scene.add.image(centerX, centerY - 62, imageKey ?? "").setScrollFactor(0);
  if (imageKey && scene.textures.exists(imageKey)) {
    const texture = scene.textures.get(imageKey).getSourceImage() as { width?: number; height?: number } | undefined;
    const sourceWidth = Math.max(1, texture?.width ?? 1);
    const sourceHeight = Math.max(1, texture?.height ?? 1);
    const scale = Math.min(PREVIEW_IMAGE_MAX_WIDTH / sourceWidth, PREVIEW_IMAGE_MAX_HEIGHT / sourceHeight);
    previewImage.setTexture(imageKey);
    previewImage.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
    previewImage.setVisible(true);
  } else {
    previewImage.setVisible(false);
  }

  const statusBadge = scene.add
    .rectangle(centerX, centerY + 96, 412, 54, accentColor, 0.94)
    .setScrollFactor(0);
  statusBadge.setStrokeStyle(2, 0xeef7ff, 0.9);

  const status = scene.add.text(centerX, centerY + 95, statusText, {
    fontFamily: FONT_FAMILY,
    fontSize: "28px",
    fontStyle: "bold",
    color: "#f4fbff",
    resolution: 2,
    align: "center",
    wordWrap: { width: 372 }
  }).setOrigin(0.5).setScrollFactor(0);

  const descriptionText = scene.add.text(centerX, centerY + 162, description, {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#d9ebff",
    resolution: 2,
    align: "center",
    wordWrap: { width: 406 }
  }).setOrigin(0.5).setScrollFactor(0);

  const hint = scene.add.text(centerX, centerY + 208, "닫기 버튼을 누르면 다음 단계로 진행됩니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    fontStyle: "bold",
    color: "#90b3d4",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  const closeButtonBg = scene.add
    .rectangle(centerX, centerY + 252, 154, 46, 0x29527d, 1)
    .setScrollFactor(0);
  closeButtonBg.setStrokeStyle(2, 0x8ed2ff, 1);
  closeButtonBg.setInteractive({ useHandCursor: true });
  closeButtonBg.on("pointerdown", onClose);
  closeButtonBg.on("pointerover", () => closeButtonBg.setFillStyle(0x34679d, 1));
  closeButtonBg.on("pointerout", () => closeButtonBg.setFillStyle(0x29527d, 1));

  const closeButtonText = scene.add.text(centerX, centerY + 252, "닫기", {
    fontFamily: FONT_FAMILY,
    fontSize: "18px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

  root.add([
    overlay,
    panelOuter,
    panel,
    accentBar,
    titleText,
    previewOuter,
    previewFrame,
    previewAccent,
    previewImage,
    previewLabel,
    statusBadge,
    status,
    descriptionText,
    hint,
    closeButtonBg,
    closeButtonText
  ]);
  return root;
}
