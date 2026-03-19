import Phaser from "phaser";
import { createPanelOuterBorder } from "@features/ui/components/uiPrimitives";

type TextStyleFactory = (
  size: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

function resolveWeeklyPlanStatusText(
  rawStatusText: string,
  backgroundImage?: Phaser.GameObjects.Image | null
): string {
  if (!/[?占?]/.test(rawStatusText) && rawStatusText.trim().length > 0) {
    return rawStatusText;
  }

  switch (backgroundImage?.texture.key) {
    case "weekly-plan-ui-practice":
      return "UI \uAD6C\uD604 \uC5F0\uC2B5 \uC9C4\uD589 \uC911...";
    case "weekly-plan-rest-api-db":
      return "REST API\uC640 \uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC124\uACC4 \uC9C4\uD589 \uC911...";
    case "weekly-plan-team-project":
      return "\uD300 \uD504\uB85C\uC81D\uD2B8 \uC9C4\uD589 \uC911...";
    default:
      return "\uAC15\uC758 \uC9C4\uD589 \uC911...";
  }
}

export function createWeeklyPlanActivityModal(
  scene: Phaser.Scene,
  options: {
    title: string;
    statusText: string;
    description: string;
    accentColor: number;
    backgroundImage?: Phaser.GameObjects.Image | null;
    getBodyStyle: TextStyleFactory;
    uiPanelInnerBorderColor: number;
    uiPanelOuterBorderColor: number;
  }
): Phaser.GameObjects.Container {
  const {
    title,
    statusText,
    description,
    accentColor,
    backgroundImage,
    getBodyStyle,
    uiPanelInnerBorderColor,
    uiPanelOuterBorderColor,
  } = options;
  const resolvedStatusText = resolveWeeklyPlanStatusText(statusText, backgroundImage);

  const width = 640;
  const height = 430;
  const centerX = 640;
  const centerY = 360;
  const imageWidth = 520;
  const imageHeight = 248;

  const overlay = scene.add.rectangle(centerX, centerY, 1280, 720, 0x000000, 0.58);
  const panelOuter = createPanelOuterBorder(scene, centerX, centerY, width, height);
  panelOuter.setStrokeStyle(6, uiPanelOuterBorderColor, 1);

  const panel = scene.add.rectangle(centerX, centerY, width, height, 0x10263f, 0.96);
  panel.setStrokeStyle(2, uiPanelInnerBorderColor, 1);

  const imageFrame = scene.add.rectangle(centerX, centerY - 54, imageWidth, imageHeight, 0x19324f, 1);
  imageFrame.setStrokeStyle(3, accentColor, 1);
  const imageShade = scene.add.rectangle(centerX, centerY - 54, imageWidth, imageHeight, accentColor, 0.08);

  if (backgroundImage) {
    backgroundImage.setPosition(centerX, centerY - 54);
    const fitScale = Math.min(
      (imageWidth - 12) / Math.max(1, backgroundImage.width),
      (imageHeight - 12) / Math.max(1, backgroundImage.height)
    );
    backgroundImage.setScale(fitScale);
    backgroundImage.setAlpha(0.98);
  }

  const badge = scene.add.rectangle(centerX, centerY - 194, 210, 34, accentColor, 1);
  badge.setStrokeStyle(2, 0xe8f3ff, 0.9);
  const badgeText = scene.add.text(centerX, centerY - 194, title, getBodyStyle(16, "#f4fbff", "bold"));
  badgeText.setOrigin(0.5);

  const status = scene.add.text(centerX, centerY + 104, resolvedStatusText, getBodyStyle(28, "#f0f7ff", "bold"));
  status.setOrigin(0.5);

  const body = scene.add.text(centerX, centerY + 146, description, getBodyStyle(18, "#c8dbef"));
  body.setOrigin(0.5);

  const hint = scene.add.text(
    centerX,
    centerY + 180,
    "\uC77C\uC815 \uC9C4\uD589 \uD6C4 \uB2E4\uC74C \uC2DC\uAC04\uB300\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4",
    getBodyStyle(15, "#90b3d4")
  );
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
    hint,
  ];

  const root = scene.add.container(0, 0, objects);
  root.setDepth(1300);
  return root;
}
