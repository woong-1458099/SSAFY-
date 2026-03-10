import Phaser from "phaser";

export type HudState = {
  timeLabel: string;
  locationLabel: string;
  week: number;
  dayLabel: string;
  hp: number;
  hpMax: number;
  money: number;
  stress: number;
  conditionLabel?: string;
};

const HUD_COLORS = {
  panelBg: 0xe8dcc2,
  panelBorder: 0x8d6b3c,
  textMain: "#3e2d1a",
  textSoft: "#6c5434",
  hpBg: 0xcfbea1,
  hpFill: 0x7ab35f,
  stressBg: 0xcfbea1,
  stressFill: 0xcb7a59,
  coin: 0xe6c45c,
  coinEdge: 0x8f6c3c,
  hintBg: 0x3e2d1a,
  hintText: "#f8e8c7"
} as const;

export class GameHud {
  private readonly scene: Phaser.Scene;
  private readonly fontFamily = "\"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

  private readonly root: Phaser.GameObjects.Container;
  private readonly leftGroup: Phaser.GameObjects.Container;
  private readonly rightGroup: Phaser.GameObjects.Container;
  private readonly topCenterGroup: Phaser.GameObjects.Container;
  private readonly hintGroup: Phaser.GameObjects.Container;

  private readonly timeText: Phaser.GameObjects.Text;
  private readonly locationText: Phaser.GameObjects.Text;
  private readonly dayText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly moneyText: Phaser.GameObjects.Text;
  private readonly stressText: Phaser.GameObjects.Text;
  private readonly conditionText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;

  private readonly hpBarFill: Phaser.GameObjects.Rectangle;
  private readonly stressBarFill: Phaser.GameObjects.Rectangle;
  private hintTween?: Phaser.Tweens.Tween;

  private readonly hpBarMaxWidth = 170;
  private readonly stressBarMaxWidth = 110;

  private hintMessage: string | null = null;
  private state: HudState = {
    timeLabel: "\uC624\uC804",
    locationLabel: "\uCEA0\uD37C\uC2A4",
    week: 1,
    dayLabel: "\uC6D4\uC694\uC77C",
    hp: 80,
    hpMax: 100,
    money: 12000,
    stress: 20
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.root = scene.add.container(0, 0);
    this.root.setDepth(700);
    this.root.setScrollFactor(0);

    this.leftGroup = scene.add.container(0, 0);
    this.leftGroup.setScrollFactor(0);
    this.rightGroup = scene.add.container(0, 0);
    this.rightGroup.setScrollFactor(0);
    this.topCenterGroup = scene.add.container(0, 0);
    this.topCenterGroup.setScrollFactor(0);
    this.hintGroup = scene.add.container(0, 0);
    this.hintGroup.setScrollFactor(0);

    this.root.add([this.leftGroup, this.rightGroup, this.topCenterGroup, this.hintGroup]);

    const leftBg = scene.add.rectangle(0, 0, 176, 84, HUD_COLORS.panelBg, 0.9);
    leftBg.setOrigin(0, 0);
    leftBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);
    this.timeText = scene.add.text(12, 9, "", this.getTextStyle(25, HUD_COLORS.textMain, "bold"));
    this.locationText = scene.add.text(12, 45, "", this.getTextStyle(21, HUD_COLORS.textSoft));
    this.leftGroup.add([leftBg, this.timeText, this.locationText]);

    const dayBg = scene.add.rectangle(0, 0, 156, 34, HUD_COLORS.panelBg, 0.9);
    dayBg.setOrigin(0.5, 0);
    dayBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);
    this.dayText = scene.add.text(0, 6, "", this.getTextStyle(18, HUD_COLORS.textMain, "bold"));
    this.dayText.setOrigin(0.5, 0);
    this.topCenterGroup.add([dayBg, this.dayText]);

    const rightBg = scene.add.rectangle(0, 0, 262, 114, HUD_COLORS.panelBg, 0.88);
    rightBg.setOrigin(0, 0);
    rightBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);

    const hpLabel = scene.add.text(12, 10, "HP", this.getTextStyle(17, HUD_COLORS.textMain, "bold"));
    const hpBarBg = scene.add.rectangle(74, 21, this.hpBarMaxWidth, 14, HUD_COLORS.hpBg, 1);
    hpBarBg.setOrigin(0, 0.5);
    hpBarBg.setStrokeStyle(1, HUD_COLORS.panelBorder, 1);
    this.hpBarFill = scene.add.rectangle(76, 21, this.hpBarMaxWidth - 4, 10, HUD_COLORS.hpFill, 1);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpText = scene.add.text(12, 30, "", this.getTextStyle(15, HUD_COLORS.textSoft));

    const coin = scene.add.circle(24, 66, 9, HUD_COLORS.coin, 1);
    coin.setStrokeStyle(2, HUD_COLORS.coinEdge, 1);
    this.moneyText = scene.add.text(40, 56, "", this.getTextStyle(20, HUD_COLORS.textMain, "bold"));

    const stressLabel = scene.add.text(12, 85, "\uC2A4\uD2B8\uB808\uC2A4", this.getTextStyle(14, HUD_COLORS.textSoft));
    const stressBarBg = scene.add.rectangle(84, 93, this.stressBarMaxWidth, 10, HUD_COLORS.stressBg, 1);
    stressBarBg.setOrigin(0, 0.5);
    stressBarBg.setStrokeStyle(1, HUD_COLORS.panelBorder, 1);
    this.stressBarFill = scene.add.rectangle(86, 93, this.stressBarMaxWidth - 4, 6, HUD_COLORS.stressFill, 1);
    this.stressBarFill.setOrigin(0, 0.5);
    this.stressText = scene.add.text(198, 84, "", this.getTextStyle(14, HUD_COLORS.textSoft));
    this.conditionText = scene.add.text(12, 97, "", this.getTextStyle(13, HUD_COLORS.textSoft));

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

    const hintBg = scene.add.rectangle(0, 0, 128, 32, HUD_COLORS.hintBg, 0.92);
    hintBg.setOrigin(0.5);
    hintBg.setStrokeStyle(2, HUD_COLORS.panelBorder, 1);
    this.hintText = scene.add.text(0, 1, "", this.getTextStyle(17, HUD_COLORS.hintText, "bold"));
    this.hintText.setOrigin(0.5);
    this.hintGroup.add([hintBg, this.hintText]);
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
    this.dayText.setText(`${this.state.week}\uC8FC\uCC28 ${this.state.dayLabel}`);

    const hpRatio = hp / hpMax;
    this.hpBarFill.width = Math.round((this.hpBarMaxWidth - 4) * hpRatio);
    this.hpText.setText(`${hp} / ${hpMax}`);
    this.hpBarFill.setFillStyle(hpRatio <= 0.3 ? 0xc66d54 : HUD_COLORS.hpFill, 1);

    this.moneyText.setText(`${Math.max(0, Math.round(this.state.money)).toLocaleString("ko-KR")} G`);

    this.stressBarFill.width = Math.round((this.stressBarMaxWidth - 4) * (stress / 100));
    this.stressText.setText(`${stress}%`);
    this.conditionText.setText(this.state.conditionLabel ?? this.getConditionLabel(stress));
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

  updateLayout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const safe = Math.max(12, Math.round(Math.min(w, h) * 0.02));

    this.leftGroup.setPosition(safe, safe);
    this.rightGroup.setPosition(Math.round(w - safe - 262), safe);
    this.topCenterGroup.setPosition(Math.round(w * 0.5), safe);
    this.hintGroup.setPosition(Math.round(w * 0.5), Math.round(h - safe - 24));
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    this.hintTween?.stop();
    this.root.destroy(true);
  }

  private getConditionLabel(stress: number): string {
    if (stress <= 25) return "\uCEE8\uB514\uC158: \uC5EC\uC720";
    if (stress <= 60) return "\uCEE8\uB514\uC158: \uBCF4\uD1B5";
    return "\uCEE8\uB514\uC158: \uD53C\uACE4";
  }

  private getTextStyle(size: number, color: string, fontStyle: "normal" | "bold" = "normal"): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: this.fontFamily,
      fontSize: `${size}px`,
      fontStyle,
      color,
      resolution: 2
    };
  }
}
