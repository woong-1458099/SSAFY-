// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

const INGREDIENTS = [
  { name: '면', color: 0xffeebb, score: 50 },
  { name: '수프', color: 0xff4422, score: 30 },
  { name: '계란', color: 0xffff88, score: 100 },
  { name: '파', color: 0x33cc33, score: 40 },
  { name: '탄 것', color: 0x222222, score: -100, bad: true }
];

export default class CookingScene extends Phaser.Scene {
  constructor() { super({ key: 'CookingScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);
    
    const W = 800, H = 600;
    this.score = 0;
    this.timeLeft = 30;
    this.gameOver = false;

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x332211);
    this.add.rectangle(W/2, 4, W, 6, 0xff8822);
    
    // 주방 느낌 바닥
    for(let i=0; i<W; i+=80) {
      for(let j=100; j<H; j+=80) {
        this.add.rectangle(i, j, 78, 78, 0x443322, 0.5).setOrigin(0);
      }
    }

    // 상단 UI
    this.add.rectangle(W/2, 40, W, 80, 0x221100, 0.9);
    this.add.text(W/2, 20, 'SSAFY 라면 달인', { fontSize: '18px', color: '#ffcc88', fontFamily: PF }).setOrigin(0.5);
    this.scoreTxt = this.add.text(20, 45, 'SCORE: 0', { fontSize: '10px', color: '#ffffff', fontFamily: PF });
    this.timeTxt = this.add.text(W-20, 45, 'TIME: 30', { fontSize: '10px', color: '#ff4444', fontFamily: PF }).setOrigin(1, 0);

    // 냄비 (플레이어)
    this.pot = this.add.container(W/2, H - 80);
    const potBody = this.add.rectangle(0, 0, 100, 60, 0x888888).setStrokeStyle(4, 0x555555);
    const handleL = this.add.rectangle(-60, -10, 30, 10, 0x555555);
    const handleR = this.add.rectangle(60, -10, 30, 10, 0x555555);
    this.pot.add([potBody, handleL, handleR]);
    
    // 물리 대신 간단한 충돌 처리용
    this.ingredients = [];

    // 입력
    this.cursors = this.input.keyboard.createCursorKeys();

    // 타이머 및 생성 루프
    this.time.addEvent({ delay: 1000, callback: this.tick, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 600, callback: this.spawnIngredient, callbackScope: this, loop: true });
    
    // 판정 메시지
    this.msgTxt = this.add.text(W/2, H/2, '', { fontSize: '20px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5).setAlpha(0);
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft--;
    this.timeTxt.setText(`TIME: ${this.timeLeft}`);
    if (this.timeLeft <= 0) this.endGame();
  }

  spawnIngredient() {
    if (this.gameOver) return;
    const W = 800;
    const data = Phaser.Utils.Array.GetRandom(INGREDIENTS);
    const x = Phaser.Math.Between(50, W-50);
    
    const obj = this.add.container(x, -50);
    const shape = this.add.circle(0, 0, 20, data.color).setStrokeStyle(3, 0xffffff);
    const txt = this.add.text(0, 0, data.name, { fontSize: '8px', color: '#000000', fontFamily: PF }).setOrigin(0.5);
    obj.add([shape, txt]);
    
    this.ingredients.push({ obj, data });
  }

  update() {
    if (this.gameOver) return;

    // 냄비 이동
    if (this.cursors.left.isDown) this.pot.x -= 8;
    else if (this.cursors.right.isDown) this.pot.x += 8;
    this.pot.x = Phaser.Math.Clamp(this.pot.x, 70, 730);

    // 재료 이동 및 충돌
    for (let i = this.ingredients.length - 1; i >= 0; i--) {
      const ing = this.ingredients[i];
      ing.obj.y += 5;

      // 충돌 검사
      if (Math.abs(ing.obj.y - this.pot.y) < 30 && Math.abs(ing.obj.x - this.pot.x) < 60) {
        this.catchIngredient(ing);
        this.ingredients.splice(i, 1);
      } else if (ing.obj.y > 650) {
        ing.obj.destroy();
        this.ingredients.splice(i, 1);
      }
    }
  }

  catchIngredient(ing) {
    this.score += ing.data.score;
    if (this.score < 0) this.score = 0;
    this.scoreTxt.setText(`SCORE: ${this.score}`);
    
    const color = ing.data.bad ? '#ff0000' : '#ffff00';
    this.showMsg(ing.data.name + '!', color);
    ing.obj.destroy();
    
    this.cameras.main.shake(100, 0.005);
  }

  showMsg(txt, color) {
    this.msgTxt.setText(txt).setColor(color).setAlpha(1).setY(this.pot.y - 60);
    this.tweens.add({ targets: this.msgTxt, alpha: 0, y: this.pot.y - 120, duration: 500 });
  }

  endGame() {
    this.gameOver = true;
    this.children.removeAll();
    
    const W = 800, H = 600;
    this.add.rectangle(W/2, H/2, W, H, 0x1a0a00);
    this.add.text(W/2, H/2 - 100, '요리 종료!', { fontSize: '30px', color: '#ff8822', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W/2, H/2, `최종 점수: ${this.score}`, { fontSize: '20px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    
    let grade = '초보 요리사';
    if(this.score > 2000) grade = '라멘 마스터';
    else if(this.score > 1200) grade = '일류 요리사';
    else if(this.score > 600) grade = '견습 요리사';
    
    this.add.text(W/2, H/2 + 60, `등급: ${grade}`, { fontSize: '15px', color: '#ffff00', fontFamily: PF }).setOrigin(0.5);
    
    const btn = this.add.rectangle(W/2, H/2 + 150, 200, 50, 0xff8822).setInteractive();
    this.add.text(W/2, H/2 + 150, '메뉴로 돌아가기', { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
