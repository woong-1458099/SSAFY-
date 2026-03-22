import Phaser from "phaser";
import type { HudState } from "../../../game/state/gameState";
import { UI_DEPTH } from "../../../game/systems/uiDepth";

const HUD_COLORS = {
  panelBg: 0x1f3b63,
  panelBorder: 0x6ab8ff,
  textMain: "#e6f3ff",
  textSoft: "#b9d6f6",
  hpBg: 0x2b4b75,
  hpFill: 0x66d1c2,
  stressBg: 0x2b4b75,
  stressFill: 0x76a4ff,
  coin: 0x9ad6ff,
  coinEdge: 0x4d9be3,
  hintBg: 0x102a49,
  hintText: "#e6f3ff"
} as const;

export class GameHud {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly leftGroup: Phaser.GameObjects.Container;
  private readonly rightGroup: Phaser.GameObjects.Container;
  private readonly topCenterGroup: Phaser.GameObjects.Container;
  private readonly hintGroup: Phaser.GameObjects.Container;
  private readonly fontFamily =
    "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

  private readonly timeText: Phaser.GameObjects.Text;
  private readonly locationText: Phaser.GameObjects.Text;
  private readonly dayText: Phaser.GameObjects.Text;
  private readonly actionPointText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly moneyText: Phaser.GameObjects.Text;
  private readonly stressText: Phaser.GameObjects.Text;
  private readonly conditionText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly hintBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private readonly stressBarFill: Phaser.GameObjects.Rectangle;

  private readonly hpBarMaxWidth = 170;
  private readonly stressBarMaxWidth = 110;
  private readonly hintMinWidth = 128;
  private readonly hintMinHeight = 32;
  private readonly hintPaddingX = 18;
  private readonly hintPaddingY = 10;

  private hintTween?: Phaser.Tweens.Tween;
  private hintMessage: string | null = null;
  private state: HudState = {
    timeLabel: "오전",
    locationLabel: "전체 지도",
    week: 1,
    dayLabel: "월요일",
    actionPoint: 4,
    maxActionPoint: 4,
    hp: 82,
    hpMax: 100,
    money: 50000,
    stress: 20
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.root = scene.add.container(0, 0).setDepth(UI_DEPTH.hud).setScrollFactor(0);
    this.leftGroup = scene.add.container(0, 0).setScrollFactor(0);
    this.rightGroup = scene.add.container(0, 0).setScrollFactor(0);
    this.topCenterGroup = scene.add.container(0, 0).setScrollFactor(0);
    this.hintGroup = scene.add.container(0, 0).setScrollFactor(0);
    this.root.add([this.leftGroup, this.rightGroup, this.topCenterGroup, this.hintGroup]);

    const leftBg = scene.add.rectangle(0, 0, 170, 102, HUD_COLORS.panelBg, 0.9);
    leftBg.setOrigin(0, 0);
    leftBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);
    this.timeText = scene.add.text(12, 8, "", this.getTextStyle(22, HUD_COLORS.textMain, "bold"));
    this.locationText = scene.add.text(12, 40, "", this.getTextStyle(18, HUD_COLORS.textSoft));
    this.actionPointText = scene.add.text(12, 72, "", this.getTextStyle(14, HUD_COLORS.textSoft, "bold"));
    this.leftGroup.add([leftBg, this.timeText, this.locationText, this.actionPointText]);

    const dayBg = scene.add.rectangle(0, 0, 148, 30, HUD_COLORS.panelBg, 0.9);
    dayBg.setOrigin(0.5, 0);
    dayBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);
    this.dayText = scene.add.text(0, 5, "", this.getTextStyle(16, HUD_COLORS.textMain, "bold"));
    this.dayText.setOrigin(0.5, 0);
    this.topCenterGroup.add([dayBg, this.dayText]);

    const rightBg = scene.add.rectangle(0, 0, 250, 108, HUD_COLORS.panelBg, 0.88);
    rightBg.setOrigin(0, 0);
    rightBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);

    const hpLabel = scene.add.text(12, 10, "HP", this.getTextStyle(15, HUD_COLORS.textMain, "bold"));
    const hpBarBg = scene.add.rectangle(74, 21, this.hpBarMaxWidth, 14, HUD_COLORS.hpBg, 1);
    hpBarBg.setOrigin(0, 0.5);
    hpBarBg.setStrokeStyle(1, HUD_COLORS.panelBorder, 1);
    this.hpBarFill = scene.add.rectangle(76, 21, this.hpBarMaxWidth - 4, 10, HUD_COLORS.hpFill, 1);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpText = scene.add.text(12, 28, "", this.getTextStyle(13, HUD_COLORS.textSoft));

    const coin = scene.add.circle(24, 66, 9, HUD_COLORS.coin, 1);
    coin.setStrokeStyle(2, HUD_COLORS.coinEdge, 1);
    this.moneyText = scene.add.text(40, 54, "", this.getTextStyle(18, HUD_COLORS.textMain, "bold"));

    const stressLabel = scene.add.text(12, 80, "스트레스", this.getTextStyle(13, HUD_COLORS.textSoft));
    const stressBarBg = scene.add.rectangle(84, 89, this.stressBarMaxWidth, 10, HUD_COLORS.stressBg, 1);
    stressBarBg.setOrigin(0, 0.5);
    stressBarBg.setStrokeStyle(1, HUD_COLORS.panelBorder, 1);
    this.stressBarFill = scene.add.rectangle(86, 89, this.stressBarMaxWidth - 4, 6, HUD_COLORS.stressFill, 1);
    this.stressBarFill.setOrigin(0, 0.5);
    this.stressText = scene.add.text(190, 80, "", this.getTextStyle(13, HUD_COLORS.textSoft));
    this.conditionText = scene.add.text(12, 92, "", this.getTextStyle(12, HUD_COLORS.textSoft));

    this.rightGroup.add([
      rightBg,
      hpLabel,
      hpBarBg,
      this.hpBarFill,
      this.hpText,
      coin,
      this.moneyText,
      stressLabel,
      stressBarBg,
      this.stressBarFill,
      this.stressText,
      this.conditionText
    ]);

    this.hintBg = scene.add.rectangle(0, 0, this.hintMinWidth, this.hintMinHeight, HUD_COLORS.hintBg, 0.92);
    this.hintBg.setOrigin(0.5);
    this.hintBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);
    this.hintText = scene.add.text(0, 0, "", {
      ...this.getTextStyle(15, HUD_COLORS.hintText, "bold"),
      align: "center"
    });
    this.hintText.setOrigin(0.5);
    this.hintText.setAlign("center");
    this.hintGroup.add([this.hintBg, this.hintText]);
    this.hintGroup.setVisible(false);

    this.applyState(this.state);
    this.updateLayout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
  }

  applyState(next: Partial<HudState>): void {
    this.state = { ...this.state, ...next };
    const hpMax = Math.max(1, Math.round(this.state.hpMax));
    const hp = Phaser.Math.Clamp(Math.round(this.state.hp), 0, hpMax);
    const stress = Phaser.Math.Clamp(Math.round(this.state.stress), 0, 100);

    this.timeText.setText(this.state.timeLabel);
    this.locationText.setText(this.state.locationLabel);
    this.dayText.setText(`${this.state.week}주차 ${this.state.dayLabel}`);
    this.actionPointText.setText(`행동력 ${this.state.actionPoint}/${this.state.maxActionPoint}`);

    const hpRatio = hp / hpMax;
    this.hpBarFill.width = Math.round((this.hpBarMaxWidth - 4) * hpRatio);
    this.hpText.setText(`${hp} / ${hpMax}`);
    this.hpBarFill.setFillStyle(hpRatio <= 0.3 ? 0xe37a7a : HUD_COLORS.hpFill, 1);

    this.moneyText.setText(`${Math.max(0, Math.round(this.state.money)).toLocaleString("ko-KR")} G`);
    this.stressBarFill.width = Math.round((this.stressBarMaxWidth - 4) * (stress / 100));
    this.stressText.setText(`${stress}%`);
    this.conditionText.setText(this.getConditionLabel(stress));
  }

  setInteractionPrompt(message: string | null): void {
    if (this.hintMessage === message) {
      return;
    }

    this.hintMessage = message;
    if (!message) {
      this.hintGroup.setVisible(false);
      this.hintTween?.stop();
      this.hintTween = undefined;
      return;
    }

    this.hintText.setText(message);
    this.updateHintGeometry();
    this.hintGroup.setVisible(true);

    this.hintTween?.stop();
    this.hintGroup.alpha = 1;
    this.hintTween = this.scene.tweens.add({
      targets: this.hintGroup,
      alpha: 0.72,
      duration: 420,
      yoyo: true,
      repeat: -1
    });
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    this.hintTween?.stop();
    this.root.destroy(true);
  }

  private updateLayout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const safe = Math.max(12, Math.round(Math.min(width, height) * 0.02));

    this.leftGroup.setPosition(safe, safe);
    this.rightGroup.setPosition(Math.round(width - safe - 250), safe);
    this.topCenterGroup.setPosition(Math.round(width * 0.5), safe);
    this.hintGroup.setPosition(Math.round(width * 0.5), Math.round(height - safe - 24));
    this.updateHintGeometry();
  }

  private updateHintGeometry(): void {
    const safe = Math.max(12, Math.round(Math.min(this.scene.scale.width, this.scene.scale.height) * 0.02));
    const maxWidth = Math.max(this.hintMinWidth, Math.round(this.scene.scale.width - safe * 2 - 24));
    const maxTextWidth = Math.max(40, maxWidth - this.hintPaddingX * 2);
    this.hintText.setWordWrapWidth(maxTextWidth, true);

    const bounds = this.hintText.getBounds();
    const nextWidth = Phaser.Math.Clamp(
      Math.ceil(bounds.width + this.hintPaddingX * 2),
      this.hintMinWidth,
      maxWidth
    );
    const nextHeight = Math.max(this.hintMinHeight, Math.ceil(bounds.height + this.hintPaddingY * 2));
    this.hintBg.setSize(nextWidth, nextHeight);
    this.hintBg.setDisplaySize(nextWidth, nextHeight);
  }

  private getConditionLabel(stress: number): string {
    if (stress <= 25) return "컨디션: 여유";
    if (stress <= 60) return "컨디션: 보통";
    return "컨디션: 피곤";
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
