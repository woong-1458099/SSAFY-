import Phaser from "phaser";
import type {
  DialogueChoice,
  DialogueChoiceActionType,
  DialogueNode
} from "../../../common/types/dialogue";
import { UI_DEPTH } from "../../../game/systems/uiDepth";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

const NPC_GENDER_MAP: Record<string, "male" | "female"> = {
  "지우": "female",
  "효련": "female",
  "김도연 프로": "female", 
  "조선미 프로": "female",
  "이혜원 코치": "female",
  "SYSTEM": "male",
};

type ChoiceView = {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  choice: DialogueChoice;
  requirementText: string;
  available: boolean;
};

type DialogueRenderOptions = {
  selectedChoiceIndex?: number;
  getRequirementText?: (choice: DialogueChoice) => string;
  isChoiceAvailable?: (choice: DialogueChoice) => boolean;
};

type DialogueLayoutMetrics = {
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  innerX: number;
  innerWidth: number;
  headerY: number;
  headerHeight: number;
  bodyY: number;
  bodyHeight: number;
  choiceY: number;
  choiceWidth: number;
  choiceWrapWidth: number;
  choiceGap: number;
  choiceHeights: number[];
  hintX: number;
  hintY: number;
  speakerBadgeWidth: number;
};

const EMOTION_LABELS: Record<string, string> = {
  NORMAL: "평온",
  ANGRY: "분노",
  FLUSTERED: "당황",
  SHY: "수줍",
  HAPPY: "기쁨",
  SAD: "슬픔",
  SURPRISED: "놀람",
  SMILE: "미소",
  SPEECHLESS: "멍함",
  TIRED: "지침"
};

const DIALOGUE_GRID = {
  maxPanelWidth: 1140,
  minPanelHeight: 220,
  panelBottomMargin: 28,
  minViewportMargin: 24,
  paddingX: 30,
  paddingTop: 24,
  paddingBottom: 20,
  rowGap: 14,
  headerHeight: 40,
  footerHeight: 20,
  minBodyHeight: 72,
  choiceGap: 10,
  choicePaddingX: 18,
  choicePaddingY: 10,
  minChoiceHeight: 42,
  minSpeakerBadgeWidth: 170,
  maxSpeakerBadgeRatio: 0.42
} as const;

export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly speakerBadge: Phaser.GameObjects.Rectangle;
  private readonly speakerText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly choiceRoot: Phaser.GameObjects.Container;
  private readonly depth = UI_DEPTH.dialogue;
  private choiceViews: ChoiceView[] = [];

  private typingEvent?: Phaser.Time.TimerEvent;
  private currentFullText: string = "";
  private warnedMissingSoundKeys = new Set<string>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(this.depth).setScrollFactor(0).setVisible(false);
    this.overlay = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x03111f, 0.24)
      .setOrigin(0)
      .setScrollFactor(0);
    this.panel = scene.add
      .rectangle(0, 0, 0, 0, 0x102842, 0.96)
      .setOrigin(0)
      .setScrollFactor(0);
    this.panel.setStrokeStyle(3, 0x8ed2ff, 1);
    this.speakerBadge = scene.add
      .rectangle(0, 0, 170, 38, 0x234e79, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    this.speakerBadge.setStrokeStyle(2, 0xb5e5ff, 1);
    this.speakerText = scene.add.text(0, 0, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#eef8ff",
      resolution: 2
    }).setOrigin(0, 0.5).setScrollFactor(0);
    this.bodyText = scene.add.text(0, 0, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      color: "#e2f2ff",
      resolution: 2,
      lineSpacing: 10,
      wordWrap: { width: 900 }
    }).setOrigin(0, 0).setScrollFactor(0);
    this.hintText = scene.add.text(0, 0, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: "#9fcdf5",
      resolution: 2,
      align: "right"
    }).setOrigin(1, 1).setScrollFactor(0);
    this.choiceRoot = scene.add.container(0, 0).setScrollFactor(0);

    this.root.add([
      this.overlay,
      this.panel,
      this.speakerBadge,
      this.speakerText,
      this.bodyText,
      this.choiceRoot,
      this.hintText
    ]);

    this.updateLayout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
  }

  show(): void {
    this.root.setVisible(true);
  }

  hide(): void {
    this.stopTyping(); 
    this.root.setVisible(false);
    this.clearChoices();
  }

  renderNode(node: DialogueNode, options: DialogueRenderOptions = {}): void {
    const selectedChoiceIndex = options.selectedChoiceIndex ?? 0;
    this.show();
    this.speakerText.setText(this.formatSpeakerTitle(node));
    this.speakerText.setColor(this.getSpeakerColor(node));
    
    this.startTypingEffect(node);

    if (node.choices && node.choices.length > 0) {
      this.renderChoices(node, selectedChoiceIndex, options);
      this.hintText.setText("[UP/DOWN] 선택   [1-4] 바로 선택   [SPACE] 확정");
    } else {
      this.clearChoices();
      this.hintText.setText("[SPACE] 다음");
    }

    this.updateLayout();
  }

  private startTypingEffect(node: DialogueNode): void {
    this.stopTyping(); 
    
    this.currentFullText = node.text;
    this.bodyText.setText(""); 
    
    let charIndex = 0;
    
    const gender = node.speakerGender || NPC_GENDER_MAP[node.speaker] || "male";
    const soundKey = gender === "male" ? "male_voice" : "female_voice";

    this.typingEvent = this.scene.time.addEvent({
      delay: 40, 
      repeat: this.currentFullText.length - 1,  
      callback: () => {
        const char = this.currentFullText[charIndex];
        if (char) {
          this.bodyText.text += char;

          if (char.trim() !== "" && charIndex % 2 === 0) {
            this.playTypingSound(soundKey);
          }
        }

        charIndex++;

        if (charIndex >= this.currentFullText.length) {
          this.stopTyping();
        }
      },
      callbackScope: this
    });
  }

  private stopTyping(): void {
    if (this.typingEvent) {
      this.typingEvent.destroy();
      this.typingEvent = undefined;
    }
  }

  private playTypingSound(preferredKey: string): void {
    const fallbackKey = "type_sfx";
    const soundKey = this.scene.cache.audio.exists(preferredKey)
      ? preferredKey
      : this.scene.cache.audio.exists(fallbackKey)
        ? fallbackKey
        : null;

    if (!soundKey) {
      if (!this.warnedMissingSoundKeys.has(preferredKey)) {
        this.warnedMissingSoundKeys.add(preferredKey);
        console.warn(`[DialogueBox] typing sound is unavailable: ${preferredKey}`);
      }
      return;
    }

    try {
      this.scene.sound.play(soundKey, { volume: soundKey === fallbackKey ? 0.18 : 0.3 });
    } catch (error) {
      if (!this.warnedMissingSoundKeys.has(soundKey)) {
        this.warnedMissingSoundKeys.add(soundKey);
        console.warn(`[DialogueBox] failed to play typing sound: ${soundKey}`, error);
      }
    }
  }

  destroy(): void {
    this.stopTyping();
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    this.clearChoices();
    this.root.destroy(true);
  }

  private renderChoices(node: DialogueNode, selectedChoiceIndex: number, options: DialogueRenderOptions): void {
    this.clearChoices();
    const choices = node.choices ?? [];

    choices.forEach((choice, index) => {
      const isSelected = index === selectedChoiceIndex;
      const requirementText = options.getRequirementText?.(choice) ?? "";
      const available = options.isChoiceAvailable?.(choice) ?? true;
      const actionType = choice.actionType ?? "NORMAL";
      const { fillColor, borderColor, textColor, alpha } = this.getChoicePalette(actionType, isSelected, available);
      const content = this.formatChoiceText(choice, index, isSelected, requirementText, available);
      const bg = this.scene.add
        .rectangle(0, 0, 0, DIALOGUE_GRID.minChoiceHeight, fillColor, 1)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setAlpha(alpha);
      bg.setStrokeStyle(2, borderColor, 1);
      const text = this.scene.add.text(0, 0, content, {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: textColor,
        resolution: 2,
        lineSpacing: 4,
        wordWrap: { width: 600 }
      }).setOrigin(0, 0).setScrollFactor(0).setAlpha(alpha);
      const root = this.scene.add.container(0, 0, [bg, text]).setScrollFactor(0);
      this.choiceRoot.add(root);
      this.choiceViews.push({ root, bg, text, choice, requirementText, available });
    });
  }

  private clearChoices(): void {
    this.choiceViews.forEach((view) => view.root.destroy(true));
    this.choiceViews = [];
    this.choiceRoot.removeAll(false);
  }

  private updateLayout(): void {
    const metrics = this.getLayoutMetrics();
    this.overlay.setSize(this.scene.scale.width, this.scene.scale.height);
    this.panel.setPosition(metrics.panelX, metrics.panelY);
    this.panel.setSize(metrics.panelWidth, metrics.panelHeight);
    this.panel.setDisplaySize(metrics.panelWidth, metrics.panelHeight);
    this.speakerBadge.setPosition(metrics.innerX, metrics.headerY + metrics.headerHeight / 2);
    this.speakerBadge.setSize(metrics.speakerBadgeWidth, metrics.headerHeight);
    this.speakerBadge.setDisplaySize(metrics.speakerBadgeWidth, metrics.headerHeight);
    this.speakerText.setPosition(metrics.innerX + 18, metrics.headerY + metrics.headerHeight / 2);
    this.bodyText.setPosition(metrics.innerX, metrics.bodyY);
    this.bodyText.setWordWrapWidth(metrics.innerWidth);
    this.hintText.setPosition(metrics.hintX, metrics.hintY);

    let currentChoiceY = metrics.choiceY;
    this.choiceViews.forEach((view, index) => {
      const choiceHeight = metrics.choiceHeights[index] ?? DIALOGUE_GRID.minChoiceHeight;
      view.bg.setPosition(metrics.innerX, currentChoiceY);
      view.bg.setSize(metrics.choiceWidth, choiceHeight);
      view.bg.setDisplaySize(metrics.choiceWidth, choiceHeight);
      view.text.setPosition(
        metrics.innerX + DIALOGUE_GRID.choicePaddingX,
        currentChoiceY + DIALOGUE_GRID.choicePaddingY
      );
      view.text.setWordWrapWidth(metrics.choiceWrapWidth);
      currentChoiceY += choiceHeight + metrics.choiceGap;
    });
  }

  private getLayoutMetrics(): DialogueLayoutMetrics {
    const viewportMargin = Math.max(
      DIALOGUE_GRID.minViewportMargin,
      Math.round(Math.min(this.scene.scale.width, this.scene.scale.height) * 0.03)
    );
    const panelWidth = Math.min(
      DIALOGUE_GRID.maxPanelWidth,
      this.scene.scale.width - viewportMargin * 2
    );
    const panelX = Math.round((this.scene.scale.width - panelWidth) / 2);
    const innerX = panelX + DIALOGUE_GRID.paddingX;
    const innerWidth = panelWidth - DIALOGUE_GRID.paddingX * 2;
    const headerY = DIALOGUE_GRID.paddingTop;
    const bodyY = headerY + DIALOGUE_GRID.headerHeight + DIALOGUE_GRID.rowGap;

    this.bodyText.setWordWrapWidth(innerWidth);
    const bodyHeight = Math.max(
      DIALOGUE_GRID.minBodyHeight,
      Math.ceil(this.bodyText.getBounds().height || this.bodyText.height || 0)
    );

    const choiceWrapWidth = Math.max(
      120,
      innerWidth - DIALOGUE_GRID.choicePaddingX * 2
    );
    const choiceHeights = this.choiceViews.map((view) =>
      this.measureChoiceHeight(view, choiceWrapWidth)
    );
    const choiceBlockHeight =
      choiceHeights.length > 0
        ? choiceHeights.reduce((sum, height) => sum + height, 0) +
          DIALOGUE_GRID.choiceGap * Math.max(0, choiceHeights.length - 1)
        : 0;
    const choiceY = bodyY + bodyHeight + (choiceHeights.length > 0 ? DIALOGUE_GRID.rowGap : 0);
    const panelHeight = Math.max(
      DIALOGUE_GRID.minPanelHeight,
      DIALOGUE_GRID.paddingTop +
        DIALOGUE_GRID.headerHeight +
        DIALOGUE_GRID.rowGap +
        bodyHeight +
        (choiceHeights.length > 0 ? DIALOGUE_GRID.rowGap + choiceBlockHeight : 0) +
        DIALOGUE_GRID.rowGap +
        DIALOGUE_GRID.footerHeight +
        DIALOGUE_GRID.paddingBottom
    );
    const panelY = Math.max(
      viewportMargin,
      Math.round(this.scene.scale.height - panelHeight - DIALOGUE_GRID.panelBottomMargin)
    );
    const speakerBadgeMaxWidth = Math.max(
      DIALOGUE_GRID.minSpeakerBadgeWidth,
      Math.floor(innerWidth * DIALOGUE_GRID.maxSpeakerBadgeRatio)
    );
    const speakerBadgeWidth = Phaser.Math.Clamp(
      Math.ceil(this.speakerText.getBounds().width + 36),
      DIALOGUE_GRID.minSpeakerBadgeWidth,
      speakerBadgeMaxWidth
    );

    return {
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      innerX,
      innerWidth,
      headerY: panelY + headerY,
      headerHeight: DIALOGUE_GRID.headerHeight,
      bodyY: panelY + bodyY,
      bodyHeight,
      choiceY: panelY + choiceY,
      choiceWidth: innerWidth,
      choiceWrapWidth,
      choiceGap: DIALOGUE_GRID.choiceGap,
      choiceHeights,
      hintX: innerX + innerWidth,
      hintY: panelY + panelHeight - DIALOGUE_GRID.paddingBottom,
      speakerBadgeWidth
    };
  }

  private measureChoiceHeight(view: ChoiceView, wrapWidth: number): number {
    view.text.setWordWrapWidth(wrapWidth);
    return Math.max(
      DIALOGUE_GRID.minChoiceHeight,
      Math.ceil((view.text.getBounds().height || view.text.height || 0) + DIALOGUE_GRID.choicePaddingY * 2)
    );
  }

  private formatSpeakerTitle(node: DialogueNode): string {
    const emotionToken = typeof node.emotion === "string" ? node.emotion.trim().toUpperCase() : "";
    const emotionLabel = EMOTION_LABELS[emotionToken];
    if (!emotionLabel) {
      return node.speaker;
    }
    return `${node.speaker} · ${emotionLabel}`;
  }

  private getSpeakerColor(node: DialogueNode): string {
    const speakerId = typeof node.speakerId === "string" ? node.speakerId.trim().toUpperCase() : "";
    if (speakerId === "SYSTEM") {
      return "#ffe39c";
    }
    if (speakerId === "PLAYER") {
      return "#aee3ff";
    }
    return "#eef8ff";
  }

  private formatChoiceText(
    choice: DialogueChoice,
    index: number,
    selected: boolean,
    requirementText: string,
    available: boolean
  ): string {
    const actionType = choice.actionType ?? "NORMAL";
    const prefix =
      actionType === "LOCKED" ? "[잠금] " : actionType === "MADNESS" ? "※ " : selected ? "> " : `${index + 1}. `;
    let content = `${prefix}${choice.text}`;

    if (requirementText.length > 0) {
      content += ` (${requirementText})`;
    }
    if (!available) {
      content += " [조건 미달]";
    }

    return content;
  }

  private getChoicePalette(actionType: DialogueChoiceActionType, selected: boolean, available: boolean) {
    if (!available) {
      return {
        fillColor: 0x2b3c4f,
        borderColor: 0x58758f,
        textColor: "#7f9cbc",
        alpha: 0.82
      };
    }

    if (actionType === "MADNESS") {
      return {
        fillColor: selected ? 0x6b2f37 : 0x472129,
        borderColor: selected ? 0xffb4b4 : 0xd77b7b,
        textColor: selected ? "#ffd4d4" : "#ff9b9b",
        alpha: 1
      };
    }

    if (actionType === "LOCKED") {
      return {
        fillColor: selected ? 0x5d5030 : 0x443a22,
        borderColor: selected ? 0xffefbb : 0xe1c278,
        textColor: selected ? "#fff2bf" : "#f3d58d",
        alpha: 1
      };
    }

    return {
      fillColor: selected ? 0x3f74a6 : 0x234360,
      borderColor: selected ? 0xbbe9ff : 0x629dd5,
      textColor: selected ? "#f5fbff" : "#d4e8fb",
      alpha: 1
    };
  }
}
