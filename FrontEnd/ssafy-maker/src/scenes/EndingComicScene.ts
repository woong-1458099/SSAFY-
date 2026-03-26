import Phaser from "phaser";
import type { EndingFlowPayload, EndingImageAsset, EndingResult } from "@features/progression/types/ending";
import { SceneKey } from "@shared/enums/sceneKey";

type EndingComicSceneData = {
  payload?: EndingFlowPayload;
  ending?: EndingResult;
};

type EndingCreditScenePayload = {
  payload: EndingFlowPayload;
  ending: EndingResult;
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
    this.revealEvent?.destroy();
    this.revealEvent = undefined;
    this.panelContainers = [];
    this.payload = data.payload;
    this.ending = data.ending;
  }

  preload(): void {
    this.ending.comicImages.forEach((image) => {
      if (!this.textures.exists(image.key)) {
        this.load.image(image.key, image.path);
      }
    });
  }

  create(): void {
    const { width, height } = this.scale;
    this.panelContainers = [];
    this.revealEvent?.destroy();
    this.revealEvent = undefined;
    this.cameras.main.setBackgroundColor("#102846");
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1f35, 1);

    if (this.ending.comicImages.length > 0) {
      this.createImageLayout(width, height);
    } else {
      this.createFallbackTextLayout(width, height);
    }

    this.playRevealSequence();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.revealEvent?.destroy();
    });
  }

  private createImageLayout(width: number, height: number): void {
    const galleryWidth = Math.min(876, Math.floor(width * 0.64));
    const sidebarWidth = Math.min(466, Math.floor(width * 0.34));
    const gap = Math.max(5, Math.floor(width * 0.005));
    const totalWidth = galleryWidth + gap + sidebarWidth;
    const startX = width / 2 - totalWidth / 2;
    const galleryCenterX = startX + galleryWidth / 2;
    const sidebarCenterX = startX + galleryWidth + gap + sidebarWidth / 2 - 18;
    const layoutCenterY = height / 2 + 12;

    this.createImageGrid(galleryCenterX, layoutCenterY, galleryWidth);
    this.createSidebar(sidebarCenterX, layoutCenterY, sidebarWidth, height);
  }

  private createImageGrid(centerX: number, centerY: number, galleryWidth: number): void {
    const images = this.ending.comicImages;
    if (images.length === 1) {
      this.panelContainers.push(this.createImagePanel(centerX, centerY, Math.min(560, galleryWidth - 24), 332, images[0]));
      return;
    }

    const gapX = 3;
    const gapY = 28;
    const panelWidth = Math.floor((galleryWidth - gapX) / 2);
    const panelHeight = Math.floor(panelWidth * 0.62);
    const startX = centerX - panelWidth - gapX / 2;
    const startY = centerY - panelHeight - gapY / 2;

    images.forEach((image, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (panelWidth + gapX) + panelWidth / 2;
      const y = startY + row * (panelHeight + gapY) + panelHeight / 2;
      this.panelContainers.push(this.createImagePanel(x, y, panelWidth, panelHeight, image));
    });
  }

  private createImagePanel(centerX: number, centerY: number, width: number, height: number, image: EndingImageAsset): Phaser.GameObjects.Container {
    const picture = this.add.image(0, 0, image.key);
    fitImage(picture, width - 8, height - 8);

    const boxWidth = Math.ceil(picture.displayWidth) + 8;
    const boxHeight = Math.ceil(picture.displayHeight) + 8;
    const background = this.add.rectangle(0, 0, boxWidth, boxHeight, PANEL_BG, 0.96).setStrokeStyle(3, PANEL_BORDER, 1);

    const container = this.add.container(centerX, centerY, [background, picture]);
    container.setAlpha(0);
    container.setScale(0.92);
    return container;
  }

  private createSidebar(centerX: number, centerY: number, panelWidth: number, height: number): void {
    const panelHeight = Math.min(548, Math.floor(height * 0.72));
    const leftX = centerX - panelWidth / 2 + 26;
    const topY = centerY - panelHeight / 2 + 28;

    this.add.rectangle(centerX, centerY, panelWidth, panelHeight, PANEL_BG, 0.94).setStrokeStyle(3, PANEL_BORDER, 1);

    this.add.text(leftX, topY, "엔딩장면", {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      resolution: 2
    }).setOrigin(0, 0);

    this.add.text(leftX, topY + 34, this.ending.title, {
      fontFamily: FONT_FAMILY,
      fontSize: "32px",
      fontStyle: "bold",
      color: TEXT_MAIN,
      wordWrap: { width: panelWidth - 52 },
      resolution: 2
    }).setOrigin(0, 0);

    this.add.text(leftX, topY + 100, buildFinalStatLines(this.payload), {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: TEXT_SUB,
      lineSpacing: 10,
      wordWrap: { width: panelWidth - 52 },
      resolution: 2
    }).setOrigin(0, 0);

    const buttonY = centerY + panelHeight / 2 - 122;
    this.createButton(centerX, buttonY, "다시보기", () => this.restartEndingFlow(), panelWidth - 64, 50);
    this.createButton(centerX, buttonY + 72, "엔딩 크레딧", () => {
      this.scene.start(SceneKey.EndingCredit, {
        payload: this.payload,
        ending: this.ending
      } satisfies EndingCreditScenePayload);
    }, panelWidth - 64, 50);
  }

  private createFallbackTextLayout(width: number, height: number): void {
    this.add.text(width / 2, 58, "엔딩 장면", {
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

    this.createTextGrid(width / 2, 360);
    this.createFallbackFooter(width, height);
  }

  private createTextGrid(centerX: number, centerY: number): void {
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
      const title = this.add.text(-panelWidth / 2 + 32, -44, `${index + 1}컷 ${panel.title}`, {
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

      const container = this.add.container(x + panelWidth / 2, y + panelHeight / 2, [bg, accent, title, body]);
      container.setAlpha(0);
      container.setScale(0.92);
      this.panelContainers.push(container);
    });
  }

  private createFallbackFooter(width: number, height: number): void {
    this.add.text(
      width / 2,
      height - 126,
      `최종 수치 FE ${this.payload.fe} / BE ${this.payload.be} / TEAM ${this.payload.teamwork} / HP ${this.payload.hp} / LUCK ${this.payload.luck}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        color: TEXT_SUB,
        resolution: 2
      }
    ).setOrigin(0.5);

    this.createButton(width / 2 - 130, height - 70, "다시보기", () => this.restartEndingFlow());
    this.createButton(width / 2 + 130, height - 70, "엔딩 크레딧", () => {
      this.scene.start(SceneKey.EndingCredit, {
        payload: this.payload,
        ending: this.ending
      } satisfies EndingCreditScenePayload);
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void, width = 220, height = 52): void {
    const button = this.add.rectangle(x, y, width, height, 0x21507d, 1).setStrokeStyle(3, PANEL_BORDER, 1);
    this.add.text(x, y, label, {
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
      repeat: Math.max(0, this.panelContainers.length - 1),
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

  private restartEndingFlow(): void {
    this.scene.start(SceneKey.Completion, this.payload);
  }
}

function fitImage(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
  const sourceWidth = image.width || 1;
  const sourceHeight = image.height || 1;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  image.setScale(scale);
}

function buildFinalStatLines(payload: EndingFlowPayload): string {
  return [
    "최종수치",
    `FE ${payload.fe}`,
    `BE ${payload.be}`,
    `TEAM ${payload.teamwork}`,
    `HP ${payload.hp} / ${payload.hpMax}`,
    `LUCK ${payload.luck}`,
    `STRESS ${payload.stress}`
  ].join("\n");
}
