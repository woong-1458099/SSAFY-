// @ts-nocheck
import Phaser from "phaser";

import { LEGACY_MINIGAME_CARDS } from "@features/minigame/minigameCatalog";
import { LEGACY_MINIGAME_MENU_SCENE_KEY } from "@features/minigame/minigameSceneKeys";

import { applyLegacyViewport } from "./viewport";

const PIXEL_FONT = '"Press Start 2P"';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: LEGACY_MINIGAME_MENU_SCENE_KEY });
  }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey ?? "MainScene";
  }

  create() {
    applyLegacyViewport(this);

    const W = 800;
    const H = 600;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);

    // 상단 장식
    this.add.rectangle(W / 2, 0, W, 4, 0xffd700);

    // 패널 배경
    this.add.rectangle(W / 2, H / 2, 750, 520, 0x0d1545, 0.98).setStrokeStyle(4, 0xffd700);

    // 제목
    this.add.text(W / 2, 65, "🎮 미니게임 선택", {
      fontSize: "22px",
      color: "#FFD700",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 안내 문구
    this.add.text(W / 2, 100, "플레이할 게임을 선택하세요", {
      fontSize: "10px",
      color: "#dff8ff",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 게임 카드 생성
    LEGACY_MINIGAME_CARDS.forEach((game, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 125 + col * 184;
      const y = 195 + row * 115;
      this.createCard(game, x, y);
    });

    // 하단 안내
    this.add.rectangle(W / 2, H - 30, W, 60, 0x08111f, 0.96);
    this.add.text(W / 2, H - 40, "게임 중 ESC: 일시정지 | Pause에서 E: 재개, ESC: 종료", {
      fontSize: "9px",
      color: "#88c7e9",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    this.add.text(W / 2, H - 20, "ESC를 눌러 돌아가기", {
      fontSize: "10px",
      color: "#c8e8ff",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // ESC 키로 돌아가기
    this.input.keyboard.on('keydown-ESC', () => {
      this.returnToMainWorld();
    });
  }

  createCard(game, x, y) {
    const shadow = this.add.rectangle(x + 4, y + 4, 172, 95, 0x000000, 0.66);
    const card = this.add.rectangle(x, y, 172, 95, game.bgColor).setInteractive().setStrokeStyle(3, game.borderColor);

    const title = this.add.text(x, y - 25, game.title, {
      fontSize: "11px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    const sub = this.add.text(x, y - 5, game.sub, {
      fontSize: "6px",
      color: "#bfe4ff",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 164 }
    }).setOrigin(0.5);

    const desc = this.add.text(x, y + 18, game.desc, {
      fontSize: "5px",
      color: "#d8e7f8",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 166 }
    }).setOrigin(0.5);

    const reward = this.add.text(x, y + 35, game.reward, {
      fontSize: "5px",
      color: "#FFD700",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    card.on("pointerover", () => {
      card.setFillStyle(game.glowColor);
      this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    card.on("pointerout", () => {
      card.setFillStyle(game.bgColor);
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 80 });
    });
    card.on("pointerdown", () => this.startSelectedGame(game.key));
  }

  startSelectedGame(sceneKey) {
    this.cameras.main.flash(160, 255, 255, 255, false);
    this.time.delayedCall(160, () => this.scene.start(sceneKey, { returnSceneKey: this.returnSceneKey }));
  }

  returnToMainWorld() {
    this.scene.stop(LEGACY_MINIGAME_MENU_SCENE_KEY);
    if (this.scene.isPaused(this.returnSceneKey)) {
      this.scene.resume(this.returnSceneKey);
      return;
    }
    this.scene.start(this.returnSceneKey);
  }
}
