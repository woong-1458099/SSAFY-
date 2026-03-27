import Phaser from "phaser";
import type { EndingFlowPayload, EndingResult } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";

type EndingIntroSceneData = {
  payload?: EndingFlowPayload;
  ending?: EndingResult;
};

type EndingFlowScenePayload = {
  payload: EndingFlowPayload;
  ending: EndingResult;
};

const FONT_FAMILY = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
const PANEL_BG = 0x17355a;
const PANEL_BG_ALT = 0x0e223a;
const PANEL_BORDER = 0x7dc9ff;
const TEXT_MAIN = "#e8f4ff";
const TEXT_SUB = "#b9d6f6";

export class EndingIntroScene extends Phaser.Scene {
  private payload!: EndingFlowPayload;
  private ending!: EndingResult;
  private stepIndex = 0;
  private metaBadge!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private metaText!: Phaser.GameObjects.Text;
  private buttonLabel!: Phaser.GameObjects.Text;

  private readonly steps: Array<{ title: string; body: (payload: EndingFlowPayload, ending: EndingResult) => string }> = [
    {
      title: "결과 정리",
      body: (_payload, ending) => ending.introLines.slice(0, 2).join("\n\n")
    },
    {
      title: "마지막 기록",
      body: (payload, ending) => `${ending.introLines[2]}\n\n최종 시점: ${payload.week}주차 ${payload.dayLabel} ${payload.timeLabel}`
    },
    {
      title: "다음 장면",
      body: (_payload, ending) => `${ending.npcLine}\n\n이제 엔딩 장면으로 넘어갑니다.`
    }
  ];

  constructor() {
    super(SceneKey.EndingIntro);
  }

  init(data: EndingIntroSceneData): void {
    if (!data.payload || !data.ending) {
      throw new Error("EndingIntroScene requires payload and ending data.");
    }

    this.stepIndex = 0;
    this.payload = data.payload;
    this.ending = data.ending;
  }

  preload(): void {
    const introImage = this.ending.introImage;
    if (introImage && !this.textures.exists(introImage.key)) {
      this.load.image(introImage.key, introImage.path);
    }
  }

  create(): void {
    const { width, height } = this.scale;
    const buttonY = height - 42;
    const panelWidth = width - 120;
    const panelTop = 108;
    const panelBottom = buttonY - 54;
    const panelHeight = panelBottom - panelTop;
    const panelCenterY = panelTop + panelHeight / 2;
    const imageCenterY = panelTop + 128;
    const titleY = panelTop + 272;
    const bodyY = panelTop + 408;

    this.cameras.main.setBackgroundColor("#102846");
    this.add.rectangle(width / 2, height / 2, width, height, PANEL_BG_ALT, 1);
    this.add.rectangle(width / 2, panelCenterY, panelWidth, panelHeight, PANEL_BG, 0.94).setStrokeStyle(3, PANEL_BORDER, 1);

    this.metaBadge = this.add.rectangle(width / 2, 56, 220, 38, 0x14304d, 0.96).setStrokeStyle(2, PANEL_BORDER, 1);
    this.metaText = this.add.text(width / 2, 56, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "17px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    const introImage = this.ending.introImage && this.textures.exists(this.ending.introImage.key)
      ? this.add.image(width / 2, imageCenterY, this.ending.introImage.key)
      : null;

    if (introImage) {
      this.add.rectangle(width / 2, imageCenterY, 396, 222, 0x0f2541, 0.72).setStrokeStyle(2, PANEL_BORDER, 0.9);
      fitImage(introImage, 372, 198);
      introImage.setDepth(1);
    } else {
      this.add.text(width / 2, panelTop + 128, "연결된 엔딩 이미지가 아직 없습니다.", {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: TEXT_SUB,
        resolution: 2
      }).setOrigin(0.5);
    }

    this.titleText = this.add.text(width / 2, introImage ? titleY : panelTop + 92, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "32px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      align: "center",
      wordWrap: { width: 740 },
      resolution: 2
    }).setOrigin(0.5);

    this.bodyText = this.add.text(width / 2, introImage ? bodyY : panelTop + 236, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      color: TEXT_MAIN,
      align: "center",
      wordWrap: { width: 720 },
      lineSpacing: 16,
      resolution: 2
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, buttonY, 220, 54, 0x21507d, 1).setStrokeStyle(3, PANEL_BORDER, 1);
    this.buttonLabel = this.add.text(width / 2, buttonY, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setFillStyle(0x2a6295, 1));
    button.on("pointerout", () => button.setFillStyle(0x21507d, 1));
    button.on("pointerdown", () => this.advanceStep());

    this.renderStep();
  }

  private renderStep(): void {
    const step = this.steps[this.stepIndex];
    const metaLabel = `${this.ending.title} 진행 ${this.stepIndex + 1} / ${this.steps.length}`;

    this.metaText.setText(metaLabel);
    this.metaBadge.setSize(Math.max(200, this.metaText.width + 34), 38);
    this.titleText.setText(step.title);
    this.bodyText.setText(step.body(this.payload, this.ending));
    this.buttonLabel.setText(this.stepIndex === this.steps.length - 1 ? "장면 보기" : "다음");
  }

  private advanceStep(): void {
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex += 1;
      this.renderStep();
      return;
    }

    this.scene.start(SceneKey.EndingComic, {
      payload: this.payload,
      ending: this.ending
    } satisfies EndingFlowScenePayload);
  }
}

function fitImage(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  image.setScale(scale);
}
