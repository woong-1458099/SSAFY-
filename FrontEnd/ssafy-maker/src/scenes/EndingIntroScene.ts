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
const PANEL_BORDER = 0x7dc9ff;
const TEXT_MAIN = "#e8f4ff";
const TEXT_SUB = "#b9d6f6";

export class EndingIntroScene extends Phaser.Scene {
  private payload!: EndingFlowPayload;
  private ending!: EndingResult;
  private stepIndex = 0;
  private readonly steps: Array<{ title: string; body: (payload: EndingFlowPayload, ending: EndingResult) => string }> = [
    {
      title: "밤 회고",
      body: (_payload, ending) => ending.introLines.slice(0, 2).join("\n\n")
    },
    {
      title: "다음 날",
      body: (payload, ending) =>
        `${ending.introLines[2]}\n\n다음 날, ${payload.week}주차를 넘긴 수료식장은 묘하게 조용하고 선명했다.`
    },
    {
      title: "마지막 한마디",
      body: (_payload, ending) => `${ending.npcLine}\n\n그 후...`
    }
  ];
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private metaText!: Phaser.GameObjects.Text;
  private buttonLabel!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.EndingIntro);
  }

  init(data: EndingIntroSceneData): void {
    if (!data.payload || !data.ending) {
      throw new Error("EndingIntroScene requires payload and ending data.");
    }
    this.payload = data.payload;
    this.ending = data.ending;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#102846");
    this.add.rectangle(width / 2, height / 2, width, height, 0x0e223a, 1);
    this.add.rectangle(width / 2, height / 2, width - 120, height - 140, PANEL_BG, 0.94).setStrokeStyle(3, PANEL_BORDER, 1);

    this.metaText = this.add.text(width / 2, 96, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    this.titleText = this.add.text(width / 2, 154, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    this.bodyText = this.add.text(width / 2, height / 2 - 20, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      color: TEXT_MAIN,
      align: "center",
      wordWrap: { width: 760 },
      lineSpacing: 14,
      resolution: 2
    }).setOrigin(0.5);

    const button = this.add.rectangle(width / 2, height - 88, 220, 54, 0x21507d, 1).setStrokeStyle(3, PANEL_BORDER, 1);
    this.buttonLabel = this.add.text(width / 2, height - 88, "", {
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
    this.metaText.setText(`${this.ending.title} 준비 흐름 ${this.stepIndex + 1} / ${this.steps.length}`);
    this.titleText.setText(step.title);
    this.bodyText.setText(step.body(this.payload, this.ending));
    this.buttonLabel.setText(this.stepIndex === this.steps.length - 1 ? "그 후..." : "다음");
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
