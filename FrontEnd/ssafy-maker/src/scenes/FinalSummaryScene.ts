import Phaser from "phaser";
import { resolveEnding } from "@features/progression/services/endingResolver";
import type { EndingFlowPayload, EndingResult, EndingSummaryStat } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";

type FinalSummarySceneData = Partial<EndingFlowPayload>;
type EndingFlowScenePayload = {
  payload: EndingFlowPayload;
  ending: EndingResult;
};

const PANEL_BG = 0x17355a;
const PANEL_BORDER = 0x7dc9ff;
const PANEL_ACCENT = 0x9ce7e3;
const TEXT_MAIN = "#e8f4ff";
const TEXT_SUB = "#b9d6f6";
const FONT_FAMILY = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export class FinalSummaryScene extends Phaser.Scene {
  private payload!: EndingFlowPayload;
  private ending!: EndingResult;

  constructor() {
    super(SceneKey.FinalSummary);
  }

  init(data: FinalSummarySceneData): void {
    this.payload = normalizePayload(data);
    this.ending = resolveEnding(this.payload);
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0f2541");

    this.add.rectangle(width / 2, height / 2, width, height, 0x102846, 1);
    this.add.rectangle(width / 2, 88, width - 96, 92, PANEL_BG, 0.92).setStrokeStyle(3, PANEL_BORDER, 1);

    this.add.text(width / 2, 58, "6주차 종료 리포트", {
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, 98, `${this.payload.week}주차 ${this.payload.dayLabel} ${this.payload.timeLabel} 이후 정산`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    this.createSummaryGrid(width / 2, 246, this.ending.summaryStats);
    this.createEndingPreview(width / 2, 480);
    this.createNextButton(width / 2, height - 70);
  }

  private createSummaryGrid(centerX: number, topY: number, stats: EndingSummaryStat[]): void {
    const columns = 3;
    const cardWidth = 220;
    const cardHeight = 108;
    const gapX = 24;
    const gapY = 18;
    const totalWidth = columns * cardWidth + (columns - 1) * gapX;
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    stats.forEach((stat, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + col * (cardWidth + gapX);
      const y = topY + row * (cardHeight + gapY);

      this.add.rectangle(x, y, cardWidth, cardHeight, PANEL_BG, 0.88).setStrokeStyle(2, PANEL_BORDER, 1);
      this.add.text(x - 82, y - 30, stat.label, {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        color: TEXT_SUB,
        resolution: 2
      });
      this.add.text(x - 82, y + 2, `${stat.value}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "36px",
        fontStyle: "bold",
        color: TEXT_MAIN,
        resolution: 2
      });
      this.add.rectangle(x + 54, y + 8, 76, 12, 0x234a72, 1).setOrigin(0.5);
      this.add.rectangle(
        x + 16,
        y + 8,
        Math.max(12, Math.min(76, Math.round((76 * Phaser.Math.Clamp(stat.value, 0, 100)) / 100))),
        12,
        PANEL_ACCENT,
        1
      ).setOrigin(0, 0.5);
    });
  }

  private createEndingPreview(centerX: number, centerY: number): void {
    this.add.rectangle(centerX, centerY, 920, 180, 0x132d4b, 0.94).setStrokeStyle(3, PANEL_BORDER, 1);
    this.add.text(centerX, centerY - 52, this.ending.title, {
      fontFamily: FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 12, this.ending.shortDescription, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      align: "center",
      wordWrap: { width: 760 },
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 54, `주요 키워드: ${this.ending.dominantLabels.join(" / ")}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: "#c8f4ff",
      resolution: 2
    }).setOrigin(0.5);
  }

  private createNextButton(x: number, y: number): void {
    const button = this.add.rectangle(x, y, 220, 54, 0x21507d, 1).setStrokeStyle(3, PANEL_BORDER, 1);
    const label = this.add.text(x, y, "다음", {
      fontFamily: FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setFillStyle(0x2a6295, 1));
    button.on("pointerout", () => button.setFillStyle(0x21507d, 1));
    button.on("pointerdown", () => {
      this.scene.start(SceneKey.EndingIntro, {
        payload: this.payload,
        ending: this.ending
      } satisfies EndingFlowScenePayload);
    });

    this.add.existing(label);
  }
}

function normalizePayload(data: FinalSummarySceneData): EndingFlowPayload {
  return {
    fe: Math.round(data.fe ?? 0),
    be: Math.round(data.be ?? 0),
    teamwork: Math.round(data.teamwork ?? 0),
    luck: Math.round(data.luck ?? 0),
    hp: Math.round(data.hp ?? 0),
    week: Math.round(data.week ?? 6),
    dayLabel: data.dayLabel ?? "일요일",
    timeLabel: data.timeLabel ?? "밤"
  };
}
