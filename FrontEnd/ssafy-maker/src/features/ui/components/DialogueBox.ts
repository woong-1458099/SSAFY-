import Phaser from "phaser";
import type { DialogueNode } from "../../../common/types/dialogue";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

type ChoiceView = {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

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
  private readonly depth = 10000;
  private choiceViews: ChoiceView[] = [];

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
    this.root.setVisible(false);
    this.clearChoices();
  }

  renderNode(node: DialogueNode, selectedChoiceIndex = 0): void {
    this.show();
    this.speakerText.setText(node.speaker);
    this.bodyText.setText(node.text);

    if (node.choices && node.choices.length > 0) {
      this.renderChoices(node, selectedChoiceIndex);
      this.hintText.setText("[UP/DOWN] 선택   [SPACE] 확정");
    } else {
      this.clearChoices();
      this.hintText.setText("[SPACE] 다음");
    }

    this.updateLayout();
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    this.clearChoices();
    this.root.destroy(true);
  }

  private renderChoices(node: DialogueNode, selectedChoiceIndex: number): void {
    this.clearChoices();
    const choices = node.choices ?? [];
    const { panelX, panelY, panelWidth, panelHeight } = this.getLayoutMetrics();
    const choiceStartY = panelY + panelHeight - 98 - (choices.length - 1) * 54;

    choices.forEach((choice, index) => {
      const isSelected = index === selectedChoiceIndex;
      const bg = this.scene.add
        .rectangle(panelX + 30, choiceStartY + index * 54, panelWidth - 60, 42, isSelected ? 0x3f74a6 : 0x234360, 1)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
      bg.setStrokeStyle(2, isSelected ? 0xbbe9ff : 0x629dd5, 1);
      const text = this.scene.add.text(panelX + 48, choiceStartY + index * 54 - 1, `${index + 1}. ${choice.text}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: isSelected ? "#f5fbff" : "#d4e8fb",
        resolution: 2,
        wordWrap: { width: panelWidth - 96 }
      }).setOrigin(0, 0.5).setScrollFactor(0);
      const root = this.scene.add.container(0, 0, [bg, text]).setScrollFactor(0);
      this.choiceRoot.add(root);
      this.choiceViews.push({ root, bg, text });
    });
  }

  private clearChoices(): void {
    this.choiceViews.forEach((view) => view.root.destroy(true));
    this.choiceViews = [];
    this.choiceRoot.removeAll(false);
  }

  private updateLayout(): void {
    const { panelX, panelY, panelWidth, panelHeight } = this.getLayoutMetrics();
    this.overlay.setSize(this.scene.scale.width, this.scene.scale.height);
    this.panel.setPosition(panelX, panelY);
    this.panel.setSize(panelWidth, panelHeight);
    this.panel.setDisplaySize(panelWidth, panelHeight);
    this.speakerBadge.setPosition(panelX + 30, panelY + 30);
    this.speakerText.setPosition(panelX + 20, panelY + 30);
    this.bodyText.setPosition(panelX + 32, panelY + 64);
    this.bodyText.setWordWrapWidth(panelWidth - 64);
    this.hintText.setPosition(panelX + panelWidth - 28, panelY + panelHeight - 20);

    if (this.choiceViews.length > 0) {
      const choiceStartY = panelY + panelHeight - 98 - (this.choiceViews.length - 1) * 54;
      this.choiceViews.forEach((view, index) => {
        const y = choiceStartY + index * 54;
        view.bg.setPosition(panelX + 30, y);
        view.bg.setSize(panelWidth - 60, 42);
        view.bg.setDisplaySize(panelWidth - 60, 42);
        view.text.setPosition(panelX + 48, y - 1);
        view.text.setWordWrapWidth(panelWidth - 96);
      });
    }
  }

  private getLayoutMetrics() {
    const panelWidth = Math.min(1140, this.scene.scale.width - 64);
    const panelHeight = 244;
    const panelX = Math.round((this.scene.scale.width - panelWidth) / 2);
    const panelY = Math.round(this.scene.scale.height - panelHeight - 28);
    return { panelX, panelY, panelWidth, panelHeight };
  }
}
