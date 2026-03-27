import Phaser from "phaser";
import { UI_DEPTH } from "../../../game/systems/uiDepth";

const GUIDE_COLORS = {
  panelBg: [0x1a2b44, 0x101a2a],
  panelBorder: 0x6ab8ff,
  titleText: "#6ab8ff",
  mainText: "#ffffff",
  subText: "#b9d6f6",
  accentText: "#ffd000",
  iconBg: 0x4a9eff
} as const;

export type GuideState = {
  objective: string;
  location?: string;
  npc?: string;
  action?: string;
};

export class GameGuideUI {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly objectiveText: Phaser.GameObjects.Text;
  private readonly detailsText: Phaser.GameObjects.Text;
  private readonly iconGraphic: Phaser.GameObjects.Graphics;
  private readonly fontFamily =
    "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

  private state: GuideState = {
    objective: "튜토리얼 진행 중"
  };

  private width = 220;
  private height = 100;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.root = scene.add.container(0, 0).setDepth(UI_DEPTH.hud).setScrollFactor(0);

    this.panel = scene.add.graphics();
    
    this.iconGraphic = scene.add.graphics();
    // Draw a small bookmark/flag icon
    this.iconGraphic.fillStyle(GUIDE_COLORS.iconBg, 1);
    this.iconGraphic.fillRoundedRect(10, 8, 16, 16, 4);

    this.titleLabel = scene.add.text(
      32,
      8,
      "현재 목표",
      this.getTextStyle(13, GUIDE_COLORS.titleText, "bold")
    );

    this.objectiveText = scene.add.text(
      12,
      28,
      "",
      this.getTextStyle(15, GUIDE_COLORS.mainText, "bold")
    );
    this.objectiveText.setWordWrapWidth(this.width - 24);

    this.detailsText = scene.add.text(
      12,
      52,
      "",
      this.getTextStyle(12, GUIDE_COLORS.subText)
    );
    this.detailsText.setWordWrapWidth(this.width - 24);
    this.detailsText.setLineSpacing(2);

    this.root.add([this.panel, this.iconGraphic, this.titleLabel, this.objectiveText, this.detailsText]);

    this.updateLayout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    
    this.refreshPanel();
  }

  applyState(next: Partial<GuideState>): void {
    const prevObjective = this.state.objective;
    const prevLoc = this.state.location;
    this.state = { ...this.state, ...next };

    this.objectiveText.setText(this.state.objective);
    
    let details = "";
    if (this.state.location) {
      details += `🚩 장소: ${this.state.location}\n`;
    }
    if (this.state.npc) {
      details += `👤 대상: ${this.state.npc}\n`;
    }
    if (this.state.action) {
      details += `✨ ${this.state.action}`;
    }
    
    this.detailsText.setText(details.trim());
    
    if (prevObjective !== this.state.objective || prevLoc !== this.state.location) {
        this.animateChange();
    }
    
    this.refreshPanel();
  }

  private animateChange(): void {
    this.scene.tweens.add({
        targets: this.root,
        alpha: { from: 0.5, to: 1 },
        x: { from: this.root.x - 5, to: this.root.x },
        duration: 300,
        ease: "Power2"
    });
  }

  private refreshPanel(): void {
    this.panel.clear();
    
    const padding = 12;
    this.height = Math.max(80, this.detailsText.y + this.detailsText.height + padding);

    // Shadow
    this.panel.fillStyle(0x000000, 0.4);
    this.panel.fillRoundedRect(4, 4, this.width, this.height, 8);

    // Background Gradient
    this.panel.lineStyle(2, GUIDE_COLORS.panelBorder, 0.8);
    this.panel.fillStyle(GUIDE_COLORS.panelBg[0], 0.9);
    this.panel.fillRoundedRect(0, 0, this.width, this.height, 8);
    this.panel.strokeRoundedRect(0, 0, this.width, this.height, 8);
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    this.root.destroy(true);
  }

  private updateLayout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const safe = Math.max(12, Math.round(Math.min(width, height) * 0.02));

    this.root.setPosition(safe, safe + 102 + 10);
  }

  private getTextStyle(
    size: number,
    color: string,
    fontStyle: "normal" | "bold" = "normal"
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: this.fontFamily,
      fontSize: `${size}px`,
      fontStyle,
      color,
      resolution: 2
    };
  }
}
