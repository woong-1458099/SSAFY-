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
    this.moveSpeed = 2.6;
    this.selectorOpen = false;

    this.drawCampus();
    this.createPlayer();
    this.createNpc();
    this.createHud();
    this.createSelector();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,S,D,E,ESC");
  }

  update() {
    const nearNpc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < 86;

    if (this.selectorOpen) {
      this.playerShadow.setVisible(false);
      this.playerPrompt.setVisible(false);

      if (Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
        this.closeSelector();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
      this.returnToMainWorld();
      return;
    }

    const direction = new Phaser.Math.Vector2(
      (this.wasd.D.isDown || this.cursors.right.isDown ? 1 : 0) - (this.wasd.A.isDown || this.cursors.left.isDown ? 1 : 0),
      (this.wasd.S.isDown || this.cursors.down.isDown ? 1 : 0) - (this.wasd.W.isDown || this.cursors.up.isDown ? 1 : 0)
    );

    if (direction.lengthSq() > 0) {
      direction.normalize().scale(this.moveSpeed);
      this.player.x = Phaser.Math.Clamp(this.player.x + direction.x, 42, 758);
      this.player.y = Phaser.Math.Clamp(this.player.y + direction.y, 132, 540);
      this.playerShadow.setPosition(this.player.x, this.player.y + 24).setVisible(true);
      this.animatePlayerWalk();
    } else {
      this.stopPlayerWalk();
    }

    this.playerPrompt.setVisible(nearNpc);
    if (nearNpc && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
      this.openSelector();
    }
  }

  drawCampus() {
    const width = 800;
    const height = 600;

    this.add.rectangle(width / 2, height / 2, width, height, 0x316f42);
    for (let index = 0; index < 32; index += 1) {
      this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(120, height),
        Phaser.Math.Between(18, 42),
        0x3b824a,
        0.18
      );
    }

    this.add.rectangle(width / 2, 6, width, 6, 0xffd700);
    this.add.rectangle(width / 2, 48, width, 84, 0x10243d, 0.96);
    this.add.text(28, 52, "SSAFY 미니게임 필드", {
      fontSize: "18px",
      color: "#FFD700",
      fontFamily: PIXEL_FONT
    });
    this.add.text(772, 24, "NPC 게임 마스터", {
      fontSize: "9px",
      color: "#9fd8ff",
      fontFamily: PIXEL_FONT
    }).setOrigin(1, 0);
    this.add.text(772, 52, `미니게임 ${LEGACY_MINIGAME_CARDS.length}종 준비 완료`, {
      fontSize: "9px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT
    }).setOrigin(1, 0);

    this.add.rectangle(400, 378, 520, 136, 0xc7b98f).setStrokeStyle(4, 0x8f7a4d);
    this.add.rectangle(400, 378, 454, 74, 0xb8d4ea, 1).setStrokeStyle(3, 0x7aa2bf);
    this.add.text(400, 382, "SSAFY 미니게임 연구소", {
      fontSize: "18px",
      color: "#22384d",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.add.rectangle(128, 482, 180, 92, 0x4f3e2d).setStrokeStyle(4, 0x2e241a);
    this.add.rectangle(128, 454, 124, 46, 0x8dd0f8).setStrokeStyle(3, 0xeaf8ff);
    this.add.rectangle(128, 505, 196, 18, 0x775c41);
    this.add.rectangle(664, 474, 158, 108, 0x52392c).setStrokeStyle(4, 0x301d15);
    this.add.rectangle(664, 444, 108, 44, 0x8dd0f8).setStrokeStyle(3, 0xeaf8ff);
    this.add.rectangle(664, 509, 172, 18, 0x775c41);
    this.add.rectangle(690, 206, 120, 54, 0x1d3045).setStrokeStyle(4, 0x88d7ff);
    this.add.text(690, 206, "게임\n구역", {
      fontSize: "11px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT,
      align: "center"
    }).setOrigin(0.5);

    this.add.rectangle(595, 332, 138, 80, 0x6b5630).setStrokeStyle(4, 0x3e2d18);
    this.add.rectangle(595, 302, 96, 18, 0xecd99a);
    this.add.text(595, 301, "NPC 부스", {
      fontSize: "8px",
      color: "#4a361d",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
  }

  createPlayer() {
    this.player = this.add.container(170, 420);
    const body = this.add.rectangle(0, 0, 22, 26, 0x4da3ff).setStrokeStyle(3, 0xd7f0ff);
    const head = this.add.rectangle(0, -22, 18, 18, 0xffd39f).setStrokeStyle(2, 0xbe864f);
    const hair = this.add.rectangle(0, -28, 20, 8, 0x1b2330);
    const eyeLeft = this.add.rectangle(-4, -22, 2, 2, 0x000000);
    const eyeRight = this.add.rectangle(4, -22, 2, 2, 0x000000);
    this.legLeft = this.add.rectangle(-5, 20, 6, 18, 0x233a68);
    this.legRight = this.add.rectangle(5, 20, 6, 18, 0x233a68);
    this.player.add([this.legLeft, this.legRight, body, head, hair, eyeLeft, eyeRight]);
    this.playerShadow = this.add.ellipse(170, 444, 30, 10, 0x000000, 0.25);
  }

  createNpc() {
    this.npc = this.add.container(595, 336);
    const body = this.add.rectangle(0, 0, 24, 28, 0xff8b3d).setStrokeStyle(3, 0xffd3b0);
    const head = this.add.rectangle(0, -24, 20, 18, 0xffd39f).setStrokeStyle(2, 0xbe864f);
    const visor = this.add.rectangle(0, -30, 24, 8, 0x1e3b5c);
    const badge = this.add.rectangle(0, 4, 10, 10, 0xffd700);
    this.npc.add([body, head, visor, badge]);

    this.add.text(595, 368, "게임 마스터", {
      fontSize: "7px",
      color: "#fff2cf",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.playerPrompt = this.add.text(595, 402, "E를 눌러 대화하기", {
      fontSize: "8px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT,
      backgroundColor: "#10243d",
      padding: { left: 8, right: 8, top: 6, bottom: 6 }
    }).setOrigin(0.5).setVisible(false);
  }

  createHud() {
    this.add.rectangle(400, 576, 800, 48, 0x08111f, 0.96);
    this.add.text(24, 560, "NPC에게 가까이 가서 E를 누르면 미니게임 목록이 열립니다.", {
      fontSize: "9px",
      color: "#d9f2ff",
      fontFamily: PIXEL_FONT
    });
    this.add.text(24, 578, "미니게임 중 ESC는 일시정지, Pause에서 E는 재개, ESC는 종료입니다.", {
      fontSize: "8px",
      color: "#88c7e9",
      fontFamily: PIXEL_FONT
    });
    this.add.text(772, 578, "ESC: Back To Main", {
      fontSize: "8px",
      color: "#c8e8ff",
      fontFamily: PIXEL_FONT
    }).setOrigin(1, 0);
  }

  createSelector() {
    this.selectorRoot = this.add.container(0, 0).setDepth(30).setVisible(false);
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x02050b, 0.72);
    const panel = this.add.rectangle(400, 300, 726, 454, 0x0d1545, 0.98).setStrokeStyle(4, 0xffd700);
    const title = this.add.text(400, 108, "NPC 미니게임 선택", {
      fontSize: "18px",
      color: "#FFD700",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    const guide = this.add.text(400, 142, "카드를 클릭하면 시작합니다. ESC를 누르면 창이 닫힙니다.", {
      fontSize: "8px",
      color: "#dff8ff",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.selectorRoot.add([overlay, panel, title, guide]);

    LEGACY_MINIGAME_CARDS.forEach((game, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 125 + col * 184;
      const y = 230 + row * 105;
      this.selectorRoot.add(this.createCard(game, x, y));
    });
  }

  createCard(game, x, y) {
    const container = this.add.container(0, 0);
    const shadow = this.add.rectangle(x + 4, y + 4, 172, 84, 0x000000, 0.66);
    const card = this.add.rectangle(x, y, 172, 84, game.bgColor).setInteractive().setStrokeStyle(3, game.borderColor);
    const title = this.add.text(x, y - 18, game.title, {
      fontSize: "10px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);
    const sub = this.add.text(x, y + 1, game.sub, {
      fontSize: "5px",
      color: "#bfe4ff",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 164 }
    }).setOrigin(0.5);
    const desc = this.add.text(x, y + 22, game.desc, {
      fontSize: "4px",
      color: "#d8e7f8",
      fontFamily: PIXEL_FONT,
      align: "center",
      wordWrap: { width: 166 }
    }).setOrigin(0.5);
    const reward = this.add.text(x, y + 34, game.reward, {
      fontSize: "4px",
      color: "#FFD700",
      fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    card.on("pointerover", () => {
      card.setFillStyle(game.glowColor);
      this.tweens.add({ targets: card, scaleX: 1.03, scaleY: 1.03, duration: 80 });
    });
    card.on("pointerout", () => {
      card.setFillStyle(game.bgColor);
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 80 });
    });
    card.on("pointerdown", () => this.startSelectedGame(game.key));

    container.add([shadow, card, title, sub, desc, reward]);
    return container;
  }

  openSelector() {
    this.selectorOpen = true;
    this.selectorRoot.setVisible(true);
    this.cameras.main.flash(100, 255, 255, 255, false);
  }

  closeSelector() {
    this.selectorOpen = false;
    this.selectorRoot.setVisible(false);
  }

  animatePlayerWalk() {
    if (this.walkTween) return;
    this.walkTween = this.tweens.add({
      targets: [this.legLeft, this.legRight],
      angle: { from: -12, to: 12 },
      yoyo: true,
      repeat: -1,
      duration: 120,
      ease: "Sine.easeInOut"
    });
  }

  stopPlayerWalk() {
    this.walkTween?.stop();
    this.walkTween = null;
    this.legLeft.setAngle(0);
    this.legRight.setAngle(0);
  }

  startSelectedGame(sceneKey) {
    this.cameras.main.flash(160, 255, 255, 255, false);
    this.time.delayedCall(160, () => this.scene.start(sceneKey));
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
