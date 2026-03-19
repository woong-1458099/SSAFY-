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

const DIALOGUE_PANEL_WIDTH = GAME_CONSTANTS.WIDTH - 84;
const DIALOGUE_PANEL_HEIGHT = 360;
const DIALOGUE_PANEL_BOTTOM_MARGIN = 22;
const DIALOGUE_PANEL_HORIZONTAL_PADDING = 22;
const DIALOGUE_BODY_TOP_OFFSET = 52;

function getDialoguePanelLayout(px: (value: number) => number): {
  panelWidth: number;
  panelHeight: number;
  centerX: number;
  panelCenterY: number;
  panelLeft: number;
  panelTop: number;
} {
  const panelWidth = px(DIALOGUE_PANEL_WIDTH);
  const panelHeight = px(DIALOGUE_PANEL_HEIGHT);
  const centerX = px(GAME_CONSTANTS.WIDTH / 2);
  const panelCenterY = px(GAME_CONSTANTS.HEIGHT - DIALOGUE_PANEL_BOTTOM_MARGIN - DIALOGUE_PANEL_HEIGHT / 2);
  const panelLeft = px(centerX - panelWidth / 2);
  const panelTop = px(panelCenterY - panelHeight / 2);

  return {
    panelWidth,
    panelHeight,
    centerX,
    panelCenterY,
    panelLeft,
    panelTop,
  };
}

const EMOTION_LABELS = {
  NORMAL: "\\uD3C9\\uC628",
  ANGRY: "\\uBD84\\uB178",
  FLUSTERED: "\\uB2F9\\uD669",
  SHY: "\\uC218\\uC90D",
  HAPPY: "\\uAE30\\uC068",
  SAD: "\\uC2AC\\uD514",
  SURPRISED: "\\uB180\\uB78C",
  SMILE: "\\uBBF8\\uC18C",
  SPEECHLESS: "\\uBA4D\\uD568",
  TIRED: "\\uC9C0\\uCE68",
} as const;

type DialogueEmotionToken = keyof typeof EMOTION_LABELS;

const warnedEmotionTokens = new Set<string>();
const MAX_WARNED_EMOTION_TOKENS = 32;

function getEmotionLabel(node: DialogueNode): string | null {
  const emotionToken = typeof node.emotion === "string" ? node.emotion.trim().toUpperCase() : "";
  if (!emotionToken) return null;

  if (emotionToken in EMOTION_LABELS) {
    return EMOTION_LABELS[emotionToken as DialogueEmotionToken];
  }

  if (import.meta.env.DEV && !warnedEmotionTokens.has(emotionToken)) {
    if (warnedEmotionTokens.size >= MAX_WARNED_EMOTION_TOKENS) {
      warnedEmotionTokens.clear();
    }
    warnedEmotionTokens.add(emotionToken);
    console.warn("[dialogue-ui] unsupported emotion token", emotionToken);
  }
  return null;
}

function formatSpeakerTitle(node: DialogueNode): string {
  const emotionLabel = getEmotionLabel(node);
  if (!emotionLabel) {
    return node.speaker;
  }
  return `${node.speaker} 쨌 ${emotionLabel}`;
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

export function createDialogueUi(
  scene: Phaser.Scene,
  options: {
    px: (value: number) => number;
    getBodyStyle: TextStyleFactory;
    createPanelOuterBorder: (
      centerX: number,
      centerY: number,
      panelWidth: number,
      panelHeight: number
    ) => Phaser.GameObjects.Rectangle;
    panelInnerBorderColor: number;
    onAction: () => void;
  }
): DialogueUiRefs {
  const { px, getBodyStyle, createPanelOuterBorder, panelInnerBorderColor, onAction } = options;
  const { panelWidth, panelHeight, centerX, panelCenterY, panelLeft, panelTop } = getDialoguePanelLayout(px);

  const panelOuter = createPanelOuterBorder(centerX, panelCenterY, panelWidth, panelHeight);
  const panel = scene.add.rectangle(centerX, panelCenterY, panelWidth, panelHeight, 0x132e4f, 0.94);
  panel.setStrokeStyle(2, panelInnerBorderColor, 1);

  const speaker = scene.add.text(panelLeft + DIALOGUE_PANEL_HORIZONTAL_PADDING, panelTop + 16, "", getBodyStyle(21, "#e8f4ff", "bold"));
  speaker.setOrigin(0, 0);

  const body = scene.add.text(panelLeft + DIALOGUE_PANEL_HORIZONTAL_PADDING, panelTop + DIALOGUE_BODY_TOP_OFFSET, "", getBodyStyle(19, "#cde3ff"));
  body.setOrigin(0, 0);
  body.setWordWrapWidth(px(panelWidth - DIALOGUE_PANEL_HORIZONTAL_PADDING * 2), true);
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
    "Space ?ㅼ쓬",
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

export function renderDialogueNode(
  scene: Phaser.Scene,
  options: {
    node: DialogueNode;
    root?: Phaser.GameObjects.Container;
    px: (value: number) => number;
    getBodyStyle: TextStyleFactory;
    ui: Omit<DialogueUiRefs, "root" | "actionButtonBg">;
    dialogueChoiceIndex: number;
    getRequirementText: (choice: DialogueChoice) => string;
    isChoiceAvailable: (choice: DialogueChoice) => boolean;
  }
): {
  choiceViews: DialogueChoiceView[];
  dialogueChoiceIndex: number;
} {
  const { node, root, px, getBodyStyle, ui, dialogueChoiceIndex, getRequirementText, isChoiceAvailable } = options;
  const { panelWidth, panelHeight, panelLeft, panelTop } = getDialoguePanelLayout(px);
  const hasChoices = Boolean(node.choices?.length);
  ui.speakerText.setText(formatSpeakerTitle(node));
  ui.speakerText.setColor(getSpeakerColor(node));
  ui.bodyText.setText(hasChoices ? "" : node.text);

  if (hasChoices) {
    const choiceSpacing = 10;
    const choiceX = panelLeft + DIALOGUE_PANEL_HORIZONTAL_PADDING;
    const choiceStartY = panelTop + DIALOGUE_BODY_TOP_OFFSET;
    const wrapWidth = px(panelWidth - DIALOGUE_PANEL_HORIZONTAL_PADDING * 2);

    const choiceViews = node.choices.map((choice, index) => {
      const line = scene.add.text(choiceX, choiceStartY, "", getBodyStyle(15, "#d2e7ff"));
      line.setOrigin(0, 0);
      line.setWordWrapWidth(wrapWidth, true);
      line.setLineSpacing(4);
      root?.add(line);
      return {
        text: line,
        choice,
        requirementText: getRequirementText(choice),
      };
    });

    const normalizedIndex = dialogueChoiceIndex >= node.choices.length ? 0 : dialogueChoiceIndex;
    ui.hintText.setText("?묅넃 ?좏깮 | Space 寃곗젙 | ESC 醫낅즺");
    ui.actionButtonText.setText("Space ?좏깮");
    refreshDialogueChoiceStyles(choiceViews, normalizedIndex, isChoiceAvailable);
    let nextChoiceY = choiceStartY;
    choiceViews.forEach((view) => {
      view.text.setPosition(choiceX, nextChoiceY);
      nextChoiceY += view.text.height + choiceSpacing;
    });
    return {
      choiceViews,
      dialogueChoiceIndex: normalizedIndex,
    };
  }

  ui.actionButtonText.setText(node.nextNodeId || node.action ? "Space ?ㅼ쓬" : "Space 醫낅즺");
  ui.hintText.setText(`${node.nextNodeId || node.action ? "Space ?ㅼ쓬" : "Space 醫낅즺"} | ESC 醫낅즺`);
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
    const prefix = actionType === "LOCKED" ? "?뵏 " : actionType === "MADNESS" ? "??" : selected ? "??" : "   ";
    let text = `${prefix}${view.choice.text}`;
    if (view.requirementText.length > 0) {
      text += ` (${view.requirementText})`;
    }
    if (!available) {
      text += " [議곌굔 誘몃떖]";
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

