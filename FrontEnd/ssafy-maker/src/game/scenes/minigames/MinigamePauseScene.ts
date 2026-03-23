// @ts-nocheck
import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import {
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY
} from '@features/minigame/minigameSceneKeys';

const PF = '"Press Start 2P"';

export default class MinigamePauseScene extends Phaser.Scene {
  private targetSceneKey = LEGACY_MINIGAME_MENU_SCENE_KEY;
  private returnSceneKey = LEGACY_MINIGAME_MENU_SCENE_KEY;

  constructor() {
    super({ key: LEGACY_MINIGAME_PAUSE_SCENE_KEY });
  }

  init(data) {
    this.targetSceneKey = data.targetSceneKey;
    this.returnSceneKey = data.returnSceneKey ?? LEGACY_MINIGAME_MENU_SCENE_KEY;
  }

  create() {
    applyLegacyViewport(this);
    const W = 800;
    const H = 600;

    this.add.rectangle(W / 2, H / 2, W, H, 0x02050b, 0.76);
    this.add.rectangle(W / 2, H / 2, 500, 290, 0x0d1545, 0.98).setStrokeStyle(4, 0xffd700);
    this.add.text(W / 2, 188, '일시정지', { fontSize: '28px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 228, '게임이 멈춘 상태입니다', { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 262, 'E: 계속하기', { fontSize: '10px', color: '#9fd8ff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 290, 'ESC: 허브로 나가기', { fontSize: '10px', color: '#ff98aa', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 316, 'Pause 상태에서 ESC를 한 번 더 누르면 현재 미니게임이 종료됩니다.', {
      fontSize: '9px',
      color: '#edf7ff',
      fontFamily: PF,
      align: 'center',
      wordWrap: { width: 420 },
    }).setOrigin(0.5);

    this.createButton(300, 394, '계속하기', () => this.resumeGame());
    this.createButton(500, 394, '종료하기', () => this.exitGame(), 0x4d1020, 0xff6a88);

    this.input.keyboard.on('keydown-E', this.resumeGame, this);
    this.input.keyboard.on('keydown-ESC', this.exitGame, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off('keydown-E', this.resumeGame, this);
      this.input.keyboard.off('keydown-ESC', this.exitGame, this);
    });
  }

  createButton(x, y, label, onClick, bg = 0x0f3460, border = 0x4499ff) {
    const shadow = this.add.rectangle(x + 3, y + 3, 150, 46, 0x000000, 0.6);
    const button = this.add.rectangle(x, y, 150, 46, bg).setInteractive().setStrokeStyle(3, border);
    const text = this.add.text(x, y, label, { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(border));
    button.on('pointerout', () => button.setFillStyle(bg));
    button.on('pointerdown', onClick);

    return [shadow, button, text];
  }

  resumeGame() {
    if (this.targetSceneKey) {
      this.scene.resume(this.targetSceneKey);
    }
    this.scene.stop();
  }

  exitGame() {
    if (this.targetSceneKey) {
      this.scene.stop(this.targetSceneKey);
    }
    this.scene.stop();
    this.scene.start(this.returnSceneKey);
  }
}
