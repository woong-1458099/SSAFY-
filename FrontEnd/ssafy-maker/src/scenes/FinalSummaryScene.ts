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
const PANEL_BG_ALT = 0x132d4b;
const PANEL_BORDER = 0x7dc9ff;
const PANEL_ACCENT = 0x9ce7e3;
const TEXT_MAIN = "#e8f4ff";
const TEXT_SUB = "#b9d6f6";
const FONT_FAMILY = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

type SummaryLayout = {
  headerY: number;
  headerWidth: number;
  summaryTopY: number;
  cardWidth: number;
  cardHeight: number;
  cardGapX: number;
  cardGapY: number;
  previewY: number;
  previewWidth: number;
  previewHeight: number;
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

  preload(): void {
    const previewImage = this.ending.previewImage;
    if (previewImage && !this.textures.exists(previewImage.key)) {
      this.load.image(previewImage.key, previewImage.path);
    }
  }

  create(): void {
    const { width, height } = this.scale;
    const layout = this.buildLayout(width, height, this.ending.summaryStats.length);

    this.cameras.main.setBackgroundColor("#0f2541");
    this.add.rectangle(width / 2, height / 2, width, height, 0x102846, 1);

    this.add.rectangle(width / 2, layout.headerY, layout.headerWidth, 92, PANEL_BG, 0.92).setStrokeStyle(3, PANEL_BORDER, 1);
    this.add.text(width / 2, layout.headerY - 14, "6주차 최종 결과", {
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);
    this.add.text(width / 2, layout.headerY + 18, `${this.payload.week}주차 ${this.payload.dayLabel} ${this.payload.timeLabel} 정산`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    this.createSummaryGrid(width / 2, layout.summaryTopY, this.ending.summaryStats, layout);
    this.createEndingPreview(width / 2, layout.previewY, layout);
    this.createNextButton(width / 2, layout.buttonY);
  }

  private buildLayout(width: number, height: number, statCount: number): SummaryLayout {
    const headerHeight = 92;
    const cardWidth = 192;
    const cardHeight = 90;
    const cardGapX = 22;
    const cardGapY = 16;
    const rowCount = Math.ceil(statCount / 4);
    const summaryFirstRowY = 84 + headerHeight / 2 + 30 + cardHeight / 2;
    const summaryLastRowY = summaryFirstRowY + Math.max(0, rowCount - 1) * (cardHeight + cardGapY);
    const summaryBottom = summaryLastRowY + cardHeight / 2;
    const previewHeight = 244;
    const previewY = summaryBottom + 34 + previewHeight / 2;
    const buttonY = previewY + previewHeight / 2 + 34 + 27;

    return {
      headerY: 84,
      headerWidth: width - 96,
      summaryTopY: summaryFirstRowY,
      cardWidth,
      cardHeight,
      cardGapX,
      cardGapY,
      previewY,
      previewWidth: Math.min(1000, width - 72),
      previewHeight,
      buttonY: Math.min(height - 40, buttonY)
    };
  }

  private createSummaryGrid(centerX: number, topY: number, stats: EndingSummaryStat[], layout: SummaryLayout): void {
    const columns = 4;
    const rows = Array.from({ length: Math.ceil(stats.length / columns) }, (_, rowIndex) =>
      stats.slice(rowIndex * columns, rowIndex * columns + columns)
    );

    rows.forEach((rowStats, rowIndex) => {
      const rowWidth = rowStats.length * layout.cardWidth + Math.max(0, rowStats.length - 1) * layout.cardGapX;
      const startX = centerX - rowWidth / 2 + layout.cardWidth / 2;
      const y = topY + rowIndex * (layout.cardHeight + layout.cardGapY);

      rowStats.forEach((stat, colIndex) => {
        const x = startX + colIndex * (layout.cardWidth + layout.cardGapX);

        this.add.rectangle(x, y, layout.cardWidth, layout.cardHeight, PANEL_BG, 0.9).setStrokeStyle(2, PANEL_BORDER, 1);
        this.add.text(x - 72, y - 28, stat.label, {
          fontFamily: FONT_FAMILY,
          fontSize: "18px",
          fontStyle: "bold",
          color: TEXT_SUB,
          resolution: 2
        });
        this.add.text(x - 72, y + 2, `${stat.value}`, {
          fontFamily: FONT_FAMILY,
          fontSize: "30px",
          fontStyle: "bold",
          color: TEXT_MAIN,
          resolution: 2
        });
        this.add.rectangle(x + 34, y + 12, 72, 10, 0x234a72, 1).setOrigin(0.5);
        this.add.rectangle(
          x - 2,
          y + 12,
          Math.max(10, Math.min(72, Math.round((72 * Phaser.Math.Clamp(stat.value, 0, 300)) / 300))),
          10,
          PANEL_ACCENT,
          1
        ).setOrigin(0, 0.5);
      });
    });
  }

  private createEndingPreview(centerX: number, centerY: number, layout: SummaryLayout): void {
    this.add.rectangle(centerX, centerY, layout.previewWidth, layout.previewHeight, PANEL_BG_ALT, 0.94).setStrokeStyle(3, PANEL_BORDER, 1);

    const previewImage = this.ending.previewImage && this.textures.exists(this.ending.previewImage.key)
      ? this.add.image(centerX - layout.previewWidth / 2 + 188, centerY, this.ending.previewImage.key)
      : null;

    if (previewImage) {
      fitImage(previewImage, 300, 192);
      this.add.rectangle(centerX - layout.previewWidth / 2 + 188, centerY, 320, 210, 0x0f2541, 0.75).setStrokeStyle(2, PANEL_BORDER, 0.85);
      previewImage.setDepth(1);
    }

    const textCenterX = previewImage ? centerX + 146 : centerX;
    const textWidth = previewImage ? 408 : layout.previewWidth - 84;

    this.add.text(textCenterX, centerY - 84, this.ending.title, {
      fontFamily: FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      align: "center",
      wordWrap: { width: textWidth },
      resolution: 2
    }).setOrigin(0.5, 0);

    this.add.text(textCenterX, centerY - 32, this.ending.shortDescription, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      align: "center",
      wordWrap: { width: textWidth },
      lineSpacing: 6,
      resolution: 2
    }).setOrigin(0.5, 0);

    this.add.text(textCenterX, centerY + 66, `핵심 키워드: ${this.ending.dominantLabels.join(" / ")}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: "#c8f4ff",
      align: "center",
      wordWrap: { width: textWidth },
      resolution: 2
    }).setOrigin(0.5, 0.5);

    if (!previewImage) {
      this.add.text(centerX, centerY + 100, "연결된 엔딩 이미지가 아직 없습니다.", {
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        color: TEXT_SUB,
        resolution: 2
      }).setOrigin(0.5);
    }
  }

  private createNextButton(x: number, y: number): void {
    const button = this.add.rectangle(x, y, 220, 54, 0x21507d, 1).setStrokeStyle(3, PANEL_BORDER, 1);
    const label = this.ending.presentationMode === "summaryOnly" ? "타이틀로" : "다음";
    this.add.text(x, y, label, {
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
      if (this.ending.presentationMode === "summaryOnly") {
        this.scene.start(SceneKey.Start);
        return;
      }
      this.scene.start(SceneKey.EndingIntro, {
        payload: this.payload,
        ending: this.ending
      } satisfies EndingFlowScenePayload);
    });
  }
}

function normalizePayload(data: FinalSummarySceneData): EndingFlowPayload {
  return {
    fe: Math.round(data.fe ?? 0),
    be: Math.round(data.be ?? 0),
    teamwork: Math.round(data.teamwork ?? 0),
    luck: Math.round(data.luck ?? 0),
    hp: Math.round(data.hp ?? 0),
    hpMax: Math.round(data.hpMax ?? 100),
    stress: Math.round(data.stress ?? 0),
    gamePlayCount: Math.round(data.gamePlayCount ?? 0),
    lottoRank: typeof data.lottoRank === "number" ? data.lottoRank : null,
    week: Math.round(data.week ?? 6),
    dayLabel: data.dayLabel ?? "금요일",
    timeLabel: data.timeLabel ?? "밤"
  };
}

function fitImage(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  image.setScale(scale);
}
