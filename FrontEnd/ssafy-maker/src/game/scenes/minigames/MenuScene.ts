// @ts-nocheck
import Phaser from "phaser";

import { LEGACY_MINIGAME_CARDS } from "@features/minigame/minigameCatalog";
import { LEGACY_MINIGAME_MENU_SCENE_KEY } from "@features/minigame/minigameSceneKeys";
import { isMinigameUnlocked } from "@features/minigame/minigameUnlocks";

import { applyLegacyViewport } from "./viewport";
import { SCREEN, PIXEL_FONT } from './utils';

const { W, H } = SCREEN;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: LEGACY_MINIGAME_MENU_SCENE_KEY });
  }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey ?? "main";
  }

  create() {
    applyLegacyViewport(this);

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);

    // 상단 장식
    this.add.rectangle(W / 2, 0, W, 4, 0xffd700);

    // 패널 배경
    this.add.rectangle(W / 2, H / 2, 770, 540, 0x0d1545, 0.98).setStrokeStyle(4, 0xffd700);

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

    this.add.text(W / 2, 118, "스토리 또는 번화가에서 한 번 플레이한 미니게임만 해금됩니다", {
      fontSize: "7px",
      color: "#9ec8ff",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 게임 카드 생성
    LEGACY_MINIGAME_CARDS.forEach((game, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const x = 105 + col * 148;
      const y = 190 + row * 120;
      this.createCard(game, x, y);
    });

    // 하단 안내
    this.add.rectangle(W / 2, H - 30, W, 60, 0x08111f, 0.96);
    this.add.text(W / 2, H - 44, "게임 중 ESC: 일시정지 | Pause에서 E: 재개, ESC: 종료", {
      fontSize: "9px",
      color: "#88c7e9",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    this.add.text(W / 2, H - 22, "ESC를 눌러 돌아가기", {
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
    const unlocked = isMinigameUnlocked(this, this.returnSceneKey, game.key);
    const shadow = this.add.rectangle(x + 3, y + 3, 132, 88, 0x000000, 0.66);
    const cardColor = unlocked ? game.bgColor : 0x1a2138;
    const borderColor = unlocked ? game.borderColor : 0x5d6a85;
    const card = this.add.rectangle(x, y, 132, 88, cardColor).setStrokeStyle(3, borderColor);

    const title = this.add.text(x, y - 25, game.title, {
      fontSize: "8px",
      color: unlocked ? "#ffffff" : "#c6d0e1",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    const sub = this.add.text(x, y - 5, game.sub, {
      fontSize: "5px",
      color: unlocked ? "#bfe4ff" : "#93a0b8",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 122 }
    }).setOrigin(0.5);

    const desc = this.add.text(x, y + 18, game.desc, {
      fontSize: "5px",
      color: unlocked ? "#d8e7f8" : "#99a5bc",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 122 }
    }).setOrigin(0.5);

    const reward = this.add.text(x, y + 35, game.reward, {
      fontSize: "4px",
      color: unlocked ? "#FFD700" : "#8e8a6f",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 122 }
    }).setOrigin(0.5);

    if (!unlocked) {
      this.add.rectangle(x, y, 132, 88, 0x050914, 0.34);
      this.add.text(x, y - 1, "잠금", {
        fontSize: "9px",
        color: "#ffd36b",
        fontFamily: PIXEL_FONT
      }).setOrigin(0.5);
      this.add.text(x, y + 12, "스토리/번화가에서\n먼저 해금", {
        fontSize: "5px",
        color: "#d9e6ff",
        fontFamily: PIXEL_FONT,
        align: "center"
      }).setOrigin(0.5);
      return;
    }

    card.setInteractive();
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
