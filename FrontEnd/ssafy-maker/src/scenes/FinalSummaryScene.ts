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

type SummaryLayout = {
  headerCenterY: number;
  headerWidth: number;
  headerHeight: number;
  summaryTopY: number;
  cardWidth: number;
  cardHeight: number;
  cardGapX: number;
  cardGapY: number;
  previewTopY: number;
  previewWidth: number;
  previewHeight: number;
  previewPaddingX: number;
  previewPaddingTop: number;
  previewInnerWidth: number;
  buttonY: number;
};

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
    const layout = this.buildLayout(width, height, this.ending.summaryStats.length);

    this.cameras.main.setBackgroundColor("#0f2541");

    this.add.rectangle(width / 2, height / 2, width, height, 0x102846, 1);
    this.add
      .rectangle(width / 2, layout.headerCenterY, layout.headerWidth, layout.headerHeight, PANEL_BG, 0.92)
      .setStrokeStyle(3, PANEL_BORDER, 1);

    this.add.text(width / 2, layout.headerCenterY - 28, "6주차 종료 리포트", {
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, layout.headerCenterY + 12, `${this.payload.week}주차 ${this.payload.dayLabel} ${this.payload.timeLabel} 이후 정산`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    this.createSummaryGrid(width / 2, layout.summaryTopY, this.ending.summaryStats, layout);
    this.createEndingPreview(width / 2, layout.previewTopY, layout);
    this.createNextButton(width / 2, layout.buttonY);
  }

  private buildLayout(width: number, height: number, statCount: number): SummaryLayout {
    const headerHeight = 92;
    const headerCenterY = 88;
    const headerBottom = headerCenterY + headerHeight / 2;
    const cardWidth = 220;
    const cardHeight = 104;
    const cardGapX = 24;
    const cardGapY = 18;
    const rowCount = Math.ceil(statCount / 3);
    const summaryTopY = headerBottom + 24 + cardHeight / 2;
    const summaryHeight = rowCount * cardHeight + Math.max(0, rowCount - 1) * cardGapY;
    const summaryBottom = summaryTopY - cardHeight / 2 + summaryHeight;
    const previewHeight = 162;
    const previewTopY = summaryBottom + 28 + previewHeight / 2;
    const buttonY = Math.min(height - 54, previewTopY + previewHeight / 2 + 34 + 27);

    return {
      headerCenterY,
      headerWidth: width - 96,
      headerHeight,
      summaryTopY,
      cardWidth,
      cardHeight,
      cardGapX,
      cardGapY,
      previewTopY,
      previewWidth: Math.min(920, width - 72),
      previewHeight,
      previewPaddingX: 42,
      previewPaddingTop: 28,
      previewInnerWidth: Math.min(920, width - 72) - 84,
      buttonY,
    };
  }

  private createSummaryGrid(centerX: number, topY: number, stats: EndingSummaryStat[], layout: SummaryLayout): void {
    const columns = 3;
    const rows = Array.from({ length: Math.ceil(stats.length / columns) }, (_, rowIndex) =>
      stats.slice(rowIndex * columns, rowIndex * columns + columns)
    );

    rows.forEach((rowStats, rowIndex) => {
      const rowWidth =
        rowStats.length * layout.cardWidth +
        Math.max(0, rowStats.length - 1) * layout.cardGapX;
      const startX = centerX - rowWidth / 2 + layout.cardWidth / 2;
      const y = topY + rowIndex * (layout.cardHeight + layout.cardGapY);

      rowStats.forEach((stat, colIndex) => {
        const x = startX + colIndex * (layout.cardWidth + layout.cardGapX);

        this.add.rectangle(x, y, layout.cardWidth, layout.cardHeight, PANEL_BG, 0.88).setStrokeStyle(2, PANEL_BORDER, 1);
        this.add.text(x - 82, y - 28, stat.label, {
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
    });
}

  private createEndingPreview(centerX: number, centerY: number, layout: SummaryLayout): void {
    this.add
      .rectangle(centerX, centerY, layout.previewWidth, layout.previewHeight, 0x132d4b, 0.94)
      .setStrokeStyle(3, PANEL_BORDER, 1);

    const topY = centerY - layout.previewHeight / 2 + layout.previewPaddingTop;

    this.add.text(centerX, topY, this.ending.title, {
      fontFamily: FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5, 0);

    this.add.text(centerX, topY + 44, this.ending.shortDescription, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      align: "center",
      wordWrap: { width: layout.previewInnerWidth },
      lineSpacing: 6,
      resolution: 2
    }).setOrigin(0.5, 0);

    this.add.text(centerX, centerY + layout.previewHeight / 2 - 36, `주요 키워드: ${this.ending.dominantLabels.join(" / ")}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: "#c8f4ff",
      resolution: 2
    }).setOrigin(0.5, 0.5);
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
