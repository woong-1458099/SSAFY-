import Phaser from "phaser";
import {
  LEGACY_MINIGAME_CARDS,
  type LegacyMinigameCard
} from "../../features/minigame/minigameCatalog";
import { launchMinigame, openMinigameMenu } from "../../features/minigame/MinigameGateway";
import { SCENE_KEYS } from "../../common/enums/scene";

const CARD_COLUMNS = 5;
const CARD_WIDTH = 180;
const CARD_HEIGHT = 100;
const CARD_GAP_X = 18;
const CARD_GAP_Y = 20;
const START_X = 240;
const START_Y = 225;

export class DebugMinigameHud {
  private root: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private cards: Phaser.GameObjects.GameObject[] = [];
  private visible = false;

  constructor(private scene: Phaser.Scene) {
    this.overlay = scene.add.rectangle(640, 360, 1280, 720, 0x02060d, 0.78);
    this.panel = scene.add.rectangle(640, 360, 1030, 560, 0x0d1545, 0.98);
    this.panel.setStrokeStyle(4, 0xffd700, 1);

    const title = scene.add.text(640, 105, "DEBUG MINIGAME HUD", {
      fontSize: "24px",
      color: "#FFD700",
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5);

    const subtitle = scene.add.text(640, 145, "모든 미니게임과 실험형 씬을 여기서 바로 실행합니다.", {
      fontSize: "10px",
      color: "#dff8ff",
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5);

    const legacyMenuButton = this.createBottomButton(430, 620, "레거시 메뉴", () => {
      this.hide();
      openMinigameMenu(this.scene, SCENE_KEYS.main);
    });

    const centerButton = this.createBottomButton(640, 620, "실험 센터", () => {
      this.hide();
      launchMinigame(this.scene, "MiniGameCenterScene", SCENE_KEYS.main);
    });

    const closeButton = this.createBottomButton(850, 620, "닫기", () => this.hide());

    LEGACY_MINIGAME_CARDS.forEach((card, index) => {
      const col = index % CARD_COLUMNS;
      const row = Math.floor(index / CARD_COLUMNS);
      const x = START_X + col * (CARD_WIDTH + CARD_GAP_X);
      const y = START_Y + row * (CARD_HEIGHT + CARD_GAP_Y);
      this.cards.push(...this.createCard(card, x, y));
    });

    const footer = scene.add.text(640, 582, "M: HUD 열기/닫기 | ESC: 미니게임 내부 일시정지 | 버튼 클릭으로 즉시 실행", {
      fontSize: "9px",
      color: "#88c7e9",
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5);

    this.root = scene.add.container(0, 0, [
      this.overlay,
      this.panel,
      title,
      subtitle,
      ...legacyMenuButton,
      ...centerButton,
      ...closeButton,
      ...this.cards,
      footer
    ]);
    this.root.setDepth(9800);
    this.root.setScrollFactor(0);
    this.root.setVisible(false);
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.root.setVisible(visible);
  }

  toggle() {
    this.setVisible(!this.visible);
  }

  hide() {
    this.setVisible(false);
  }

  isVisible() {
    return this.visible;
  }

  destroy() {
    this.root.destroy(true);
  }

  private createBottomButton(x: number, y: number, label: string, onClick: () => void) {
    const shadow = this.scene.add.rectangle(x + 3, y + 3, 160, 36, 0x000000, 0.66);
    const button = this.scene.add.rectangle(x, y, 160, 36, 0x1a2a4a).setStrokeStyle(3, 0x44ff88);
    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setFillStyle(0x28406a));
    button.on("pointerout", () => button.setFillStyle(0x1a2a4a));
    button.on("pointerdown", onClick);

    const text = this.scene.add.text(x, y, label, {
      fontSize: "9px",
      color: "#ffffff",
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5);

    return [shadow, button, text];
  }

  private createCard(card: LegacyMinigameCard, x: number, y: number) {
    const shadow = this.scene.add.rectangle(x + 4, y + 4, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0.68);
    const background = this.scene.add.rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, card.bgColor)
      .setStrokeStyle(3, card.borderColor);
    background.setInteractive({ useHandCursor: true });
    background.on("pointerover", () => background.setFillStyle(card.glowColor));
    background.on("pointerout", () => background.setFillStyle(card.bgColor));
    background.on("pointerdown", () => {
      this.hide();
      launchMinigame(this.scene, card.key, SCENE_KEYS.main);
    });

    const title = this.scene.add.text(x, y - 28, card.title, {
      fontSize: "9px",
      color: "#ffffff",
      fontFamily: '"Press Start 2P"'
    }).setOrigin(0.5);

    const sub = this.scene.add.text(x, y - 9, card.sub, {
      fontSize: "5px",
      color: "#d7ecff",
      fontFamily: '"Press Start 2P"',
      align: "center",
      wordWrap: { width: 154 }
    }).setOrigin(0.5);

    const desc = this.scene.add.text(x, y + 14, card.desc, {
      fontSize: "5px",
      color: "#d8e7f8",
      fontFamily: '"Press Start 2P"',
      align: "center",
      wordWrap: { width: 154 }
    }).setOrigin(0.5);

    const reward = this.scene.add.text(x, y + 34, card.reward, {
      fontSize: "4px",
      color: "#FFD700",
      fontFamily: '"Press Start 2P"',
      align: "center",
      wordWrap: { width: 154 }
    }).setOrigin(0.5);

    return [shadow, background, title, sub, desc, reward];
  }
}
