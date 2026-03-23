import Phaser from "phaser";
import type { EndingFlowPayload, EndingResult } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";

type EndingComicSceneData = {
  payload?: EndingFlowPayload;
  ending?: EndingResult;
};

const FONT_FAMILY = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
const PANEL_BG = 0x17355a;
const PANEL_BORDER = 0x7dc9ff;
const TEXT_MAIN = "#e8f4ff";
const TEXT_SUB = "#b9d6f6";

export class EndingComicScene extends Phaser.Scene {
  private ending!: EndingResult;
  private payload!: EndingFlowPayload;
  private panelContainers: Phaser.GameObjects.Container[] = [];
  private revealEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super(SceneKey.EndingComic);
  }

  init(data: EndingComicSceneData): void {
    if (!data.payload || !data.ending) {
      throw new Error("EndingComicScene requires payload and ending data.");
    }
    this.payload = data.payload;
    this.ending = data.ending;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#102846");
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1f35, 1);

    this.add.text(width / 2, 58, "그 후...", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, 96, this.ending.title, {
      fontFamily: FONT_FAMILY,
      fontSize: "34px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, 132, this.ending.shortDescription, {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      align: "center",
      wordWrap: { width: 820 },
      resolution: 2
    }).setOrigin(0.5);

    this.createComicGrid(width / 2, 360);
    this.createFooter(width, height);
    this.playRevealSequence();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.revealEvent?.destroy();
    });
  }

  private createComicGrid(centerX: number, centerY: number): void {
    const panelWidth = 360;
    const panelHeight = 150;
    const gapX = 28;
    const gapY = 22;
    const startX = centerX - panelWidth - gapX / 2;
    const startY = centerY - panelHeight - gapY / 2;

    this.ending.comicPanels.forEach((panel, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (panelWidth + gapX);
      const y = startY + row * (panelHeight + gapY);

      const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, PANEL_BG, 0.95).setStrokeStyle(3, PANEL_BORDER, 1).setOrigin(0.5);
      const accent = this.add.rectangle(-panelWidth / 2 + 12, 0, 10, panelHeight - 18, panel.accentColor, 1).setOrigin(0.5);
      const title = this.add.text(-panelWidth / 2 + 32, -44, `${index + 1}컷 · ${panel.title}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
        color: TEXT_MAIN,
        resolution: 2
      });
      const body = this.add.text(-panelWidth / 2 + 32, -4, panel.body, {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: TEXT_SUB,
        wordWrap: { width: panelWidth - 72 },
        lineSpacing: 10,
        resolution: 2
      });
      const hint = this.add.text(panelWidth / 2 - 18, panelHeight / 2 - 16, "placeholder", {
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        color: "#8bc4ef",
        resolution: 2
      }).setOrigin(1, 1);

      const container = this.add.container(x + panelWidth / 2, y + panelHeight / 2, [bg, accent, title, body, hint]);
      container.setAlpha(0);
      container.setScale(0.92);
      this.panelContainers.push(container);
    });
  }

  private createFooter(width: number, height: number): void {
    this.add.text(width / 2, height - 126, `최종 정산 · FE ${this.payload.fe} / BE ${this.payload.be} / 협업 ${this.payload.teamwork} / 체력 ${this.payload.hp} / 운 ${this.payload.luck}`, {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0.5);

    this.createButton(width / 2 - 130, height - 70, "다시보기", () => this.replayComic());
    this.createButton(width / 2 + 130, height - 70, "타이틀로", () => {
      this.scene.start(SceneKey.Start);
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void): void {
    const button = this.add.rectangle(x, y, 220, 52, 0x21507d, 1).setStrokeStyle(3, PANEL_BORDER, 1);
    const text = this.add.text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      resolution: 2
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setFillStyle(0x2a6295, 1));
    button.on("pointerout", () => button.setFillStyle(0x21507d, 1));
    button.on("pointerdown", onClick);

    this.add.existing(text);
  }

  private playRevealSequence(): void {
    this.revealEvent?.destroy();
    this.panelContainers.forEach((panel) => {
      panel.setAlpha(0);
      panel.setScale(0.92);
    });

    let revealIndex = 0;
    this.revealEvent = this.time.addEvent({
      delay: 180,
      repeat: this.panelContainers.length - 1,
      callback: () => {
        const panel = this.panelContainers[revealIndex];
        if (panel) {
          this.tweens.add({
            targets: panel,
            alpha: 1,
            scale: 1,
            duration: 180,
            ease: "Quad.out"
          });
        }
        revealIndex += 1;
      }
    });
  }

  private replayComic(): void {
    this.playRevealSequence();
  }
}
