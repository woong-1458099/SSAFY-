import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import type { DialogueChoice, DialogueNode } from "@features/story/npcDialogueScripts";

export type DialogueChoiceView = {
  text: Phaser.GameObjects.Text;
  choice: DialogueChoice;
  requirementText: string;
};

export type DialogueUiRefs = {
  root: Phaser.GameObjects.Container;
  speakerText: Phaser.GameObjects.Text;
  bodyText: Phaser.GameObjects.Text;
  hintText: Phaser.GameObjects.Text;
  actionButtonBg: Phaser.GameObjects.Rectangle;
  actionButtonText: Phaser.GameObjects.Text;
};

type TextStyleFactory = (
  size: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

const EMOTION_LABELS: Record<string, string> = {
  NORMAL: "평온",
  ANGRY: "분노",
  FLUSTERED: "당황",
  SHY: "수줍",
  HAPPY: "기쁨",
  SAD: "침울",
  SURPRISED: "놀람",
  SMILE: "미소",
  SPEECHLESS: "말없음",
  TIRED: "지침",
};

function formatSpeakerTitle(node: DialogueNode): string {
  const emotionToken = typeof node.emotion === "string" ? node.emotion.trim().toUpperCase() : "";
  const emotionLabel = EMOTION_LABELS[emotionToken];
  if (!emotionLabel) {
    return node.speaker;
  }
  return `${node.speaker} · ${emotionLabel}`;
}

function getSpeakerColor(node: DialogueNode): string {
  const speakerId = typeof node.speakerId === "string" ? node.speakerId.trim().toUpperCase() : "";
  if (speakerId === "SYSTEM") {
    return "#ffe39c";
  }
  if (speakerId === "PLAYER") {
    return "#aee3ff";
  }
  return "#e8f4ff";
}

export function createDialogueUi(scene: Phaser.Scene, options: {
  px: (value: number) => number;
  getBodyStyle: TextStyleFactory;
  createPanelOuterBorder: (centerX: number, centerY: number, panelWidth: number, panelHeight: number) => Phaser.GameObjects.Rectangle;
  panelInnerBorderColor: number;
  onAction: () => void;
}): DialogueUiRefs {
  const { px, getBodyStyle, createPanelOuterBorder, panelInnerBorderColor, onAction } = options;
  const panelWidth = px(GAME_CONSTANTS.WIDTH - 84);
  const panelHeight = 220;
  const centerX = px(GAME_CONSTANTS.WIDTH / 2);
  const panelCenterY = px(GAME_CONSTANTS.HEIGHT - 132);
  const panelLeft = px(centerX - panelWidth / 2);
  const panelTop = px(panelCenterY - panelHeight / 2);

  const panelOuter = createPanelOuterBorder(centerX, panelCenterY, panelWidth, panelHeight);
  const panel = scene.add.rectangle(centerX, panelCenterY, panelWidth, panelHeight, 0x132e4f, 0.94);
  panel.setStrokeStyle(2, panelInnerBorderColor, 1);

  const speaker = scene.add.text(panelLeft + 22, panelTop + 16, "", getBodyStyle(21, "#e8f4ff", "bold"));
  speaker.setOrigin(0, 0);

  const body = scene.add.text(panelLeft + 22, panelTop + 52, "", getBodyStyle(19, "#cde3ff"));
  body.setOrigin(0, 0);
  body.setWordWrapWidth(px(panelWidth - 44), true);
  body.setLineSpacing(8);

  const actionButtonBg = scene.add.rectangle(panelLeft + panelWidth - 90, panelTop + panelHeight - 38, 132, 34, 0x2c5888, 1);
  actionButtonBg.setStrokeStyle(2, 0x78c3ff, 1);
  actionButtonBg.setInteractive({ useHandCursor: true });
  actionButtonBg.on("pointerover", () => actionButtonBg.setFillStyle(0x34669c, 1));
  actionButtonBg.on("pointerout", () => actionButtonBg.setFillStyle(0x2c5888, 1));
  actionButtonBg.on("pointerdown", onAction);

  const actionButtonText = scene.add.text(
    panelLeft + panelWidth - 90,
    panelTop + panelHeight - 39,
    "E 다음",
    getBodyStyle(16, "#e6f3ff", "bold")
  );
  actionButtonText.setOrigin(0.5);

  const hint = scene.add.text(panelLeft + panelWidth - 20, panelTop + panelHeight - 68, "", getBodyStyle(14, "#99c4f3"));
  hint.setOrigin(1, 1);

  const root = scene.add.container(0, 0, [panelOuter, panel, speaker, body, actionButtonBg, actionButtonText, hint]);
  root.setDepth(1150);
  root.setVisible(false);

  return {
    root,
    speakerText: speaker,
    bodyText: body,
    hintText: hint,
    actionButtonBg,
    actionButtonText,
  };
}

export function clearDialogueChoices(choiceViews: DialogueChoiceView[]): DialogueChoiceView[] {
  choiceViews.forEach((view) => view.text.destroy());
  return [];
}

export function renderDialogueNode(scene: Phaser.Scene, options: {
  node: DialogueNode;
  root?: Phaser.GameObjects.Container;
  px: (value: number) => number;
  getBodyStyle: TextStyleFactory;
  ui: Omit<DialogueUiRefs, "root" | "actionButtonBg">;
  dialogueChoiceIndex: number;
  getRequirementText: (choice: DialogueChoice) => string;
  isChoiceAvailable: (choice: DialogueChoice) => boolean;
}): {
  choiceViews: DialogueChoiceView[];
  dialogueChoiceIndex: number;
} {
  const { node, root, px, getBodyStyle, ui, dialogueChoiceIndex, getRequirementText, isChoiceAvailable } = options;
  ui.speakerText.setText(formatSpeakerTitle(node));
  ui.speakerText.setColor(getSpeakerColor(node));
  ui.bodyText.setText(node.text);

  if (node.choices?.length) {
    const choiceStartY = px(GAME_CONSTANTS.HEIGHT - 122);
    const choiceSpacing = 26;
    const choiceX = px(74);
    const wrapWidth = px(GAME_CONSTANTS.WIDTH - 148);

    const choiceViews = node.choices.map((choice, index) => {
      const line = scene.add.text(choiceX, choiceStartY + index * choiceSpacing, "", getBodyStyle(17, "#d2e7ff"));
      line.setOrigin(0, 0);
      line.setWordWrapWidth(wrapWidth, true);
      root?.add(line);
      return {
        text: line,
        choice,
        requirementText: getRequirementText(choice),
      };
    });

    const normalizedIndex = dialogueChoiceIndex >= node.choices.length ? 0 : dialogueChoiceIndex;
    ui.hintText.setText("↑↓ 선택  |  E 또는 버튼 결정  |  ESC 종료");
    ui.actionButtonText.setText("E 선택");
    refreshDialogueChoiceStyles(choiceViews, normalizedIndex, isChoiceAvailable);
    return {
      choiceViews,
      dialogueChoiceIndex: normalizedIndex,
    };
  }

  ui.actionButtonText.setText(node.nextNodeId || node.action ? "E 다음" : "E 종료");
  ui.hintText.setText(`${node.nextNodeId || node.action ? "E 다음" : "E 종료"}  |  ESC 종료`);
  return {
    choiceViews: [],
    dialogueChoiceIndex,
  };
}

export function refreshDialogueChoiceStyles(
  choiceViews: DialogueChoiceView[],
  dialogueChoiceIndex: number,
  isChoiceAvailable: (choice: DialogueChoice) => boolean
): void {
  choiceViews.forEach((view, index) => {
    const selected = index === dialogueChoiceIndex;
    const available = isChoiceAvailable(view.choice);
    const actionType = view.choice.actionType ?? "NORMAL";
    const prefix = actionType === "LOCKED" ? "🔒 " : actionType === "MADNESS" ? "⚠ " : selected ? "▶ " : "   ";
    let text = `${prefix}${view.choice.text}`;
    if (view.requirementText.length > 0) {
      text += ` (${view.requirementText})`;
    }
    if (!available) {
      text += " [조건 미달]";
    }
    view.text.setText(text);

    const baseColor =
      actionType === "MADNESS"
        ? "#ff9b9b"
        : actionType === "LOCKED"
          ? "#f3d58d"
          : "#bfd9f8";
    const selectedColor =
      actionType === "MADNESS"
        ? "#ffd4d4"
        : actionType === "LOCKED"
          ? "#fff2bf"
          : "#f0f8ff";

    view.text.setColor(available ? (selected ? selectedColor : baseColor) : "#7f9cbc");
    view.text.setAlpha(available ? 1 : 0.78);
  });
}
