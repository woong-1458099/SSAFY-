// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';

const PF = '"Press Start 2P"';

export default class RunnerScene extends Phaser.Scene {
  constructor() { super({ key: 'RunnerScene' }); }

  create() {
    installMinigamePause(this);
    const W = 800, H = 600;
    this.score = 0; this.gameOver = false; this.speed = 300; this.jumpCount = 0; this.obstacles = []; this.grounds = [];
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.stars = [];
    for (let i = 0; i < 40; i += 1) {
      const star = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, 300), Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.6));
      this.stars.push({ obj: star, speed: Phaser.Math.FloatBetween(0.3, 1) });
    }
    this.add.rectangle(W / 2, 25, W, 50, 0x0d1545, 0.95);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W / 2, 50, W, 3, 0x4488ff);
    this.add.text(W / 2, 10, 'BUS RUNNER', { fontSize: '14px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5, 0);
    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', { fontSize: '9px', color: '#ffffff', fontFamily: PF });
    this.hiTxt = this.add.text(W - 20, 12, 'BEST: 0', { fontSize: '9px', color: '#FFD700', fontFamily: PF }).setOrigin(1, 0);
    this.groundY = 480;
    this.add.rectangle(W / 2, this.groundY + 20, W, 3, 0x4488ff, 0.5);
    for (let i = 0; i < 26; i += 1) this.grounds.push(this.add.rectangle(i * 32, this.groundY + 30, 28, 8, 0x223366).setOrigin(0, 0.5));
    this.buildings = [];
    for (let i = 0; i < 6; i += 1) {
      const bh = Phaser.Math.Between(60, 150), bw = Phaser.Math.Between(40, 80), bx = i * 150 + Phaser.Math.Between(0, 50);
      const building = this.add.rectangle(bx, this.groundY - bh / 2, bw, bh, 0x112244).setStrokeStyle(1, 0x223366);
      for (let r = 0; r < 3; r += 1) for (let c = 0; c < 2; c += 1) this.add.rectangle(bx - 10 + c * 20, this.groundY - bh + 20 + r * 30, 10, 12, Math.random() > 0.4 ? 0xffdd88 : 0x112244);
      this.buildings.push({ obj: building, speed: 0.4 });
    }
    this.playerX = 120; this.playerY = this.groundY - 30; this.playerVY = 0; this.isGround = true;
    this.player = this.add.container(this.playerX, this.playerY);
    const body = this.add.rectangle(0, 0, 36, 44, 0x4499ff).setStrokeStyle(3, 0x88ccff);
    const head = this.add.rectangle(0, -34, 28, 24, 0xffcc88).setStrokeStyle(2, 0xdd9944);
    const eye = this.add.rectangle(6, -36, 6, 6, 0x000000);
    const mouth = this.add.rectangle(4, -26, 10, 4, 0xcc4444);
    const vest = this.add.rectangle(0, 2, 36, 30, 0x002266).setStrokeStyle(2, 0x4499ff);
    const badge = this.add.rectangle(-8, -4, 12, 8, 0xFFD700);
    const badgeTxt = this.add.text(-8, -4, 'S', { fontSize: '6px', color: '#000000', fontFamily: PF }).setOrigin(0.5);
    this.player.add([body, vest, head, eye, mouth, badge, badgeTxt]).setDepth(5);
    this.legAnim = 0;
    this.legL = this.add.rectangle(this.playerX - 8, this.playerY + 28, 10, 20, 0x4499ff);
    this.legR = this.add.rectangle(this.playerX + 8, this.playerY + 28, 10, 20, 0x4499ff);
    this.hintTxt = this.add.text(W / 2, 540, 'SPACE / CLICK = JUMP', { fontSize: '9px', color: '#445577', fontFamily: PF }).setOrigin(0.5);
    this.showCountdown();
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    this.input.on('pointerdown', this.jump, this);
  }

  showCountdown() {
    const W = 800; let count = 3;
    const countTxt = this.add.text(W / 2, 280, '3', { fontSize: '60px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.time.addEvent({
      delay: 700, repeat: 2,
      callback: () => {
        count -= 1;
        if (count > 0) this.tweens.add({ targets: countTxt.setText(String(count)), scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
        else {
          countTxt.setText('RUN!').setColor('#00ff88');
          this.tweens.add({ targets: countTxt, alpha: 0, duration: 400, onComplete: () => { countTxt.destroy(); this.hintTxt.setVisible(false); this.started = true; this.spawnObstacle(); this.obstacleEvent = this.time.addEvent({ delay: this.getSpawnDelay(), loop: false, callback: this.scheduleObstacle, callbackScope: this }); } });
        }
      },
    });
  }

  getSpawnDelay() { return Math.max(1200, 2200 - this.score * 2); }
  scheduleObstacle() { if (!this.gameOver) { this.spawnObstacle(); this.obstacleEvent = this.time.addEvent({ delay: this.getSpawnDelay(), loop: false, callback: this.scheduleObstacle, callbackScope: this }); } }

  spawnObstacle() {
    if (this.gameOver) return;
    const W = 800, type = Phaser.Math.Between(0, 2); let obstacle;
    if (type === 0) {
      obstacle = this.add.container(W + 30, this.groundY - 20);
      obstacle.add([this.add.rectangle(0, 0, 28, 40, 0xff4466).setStrokeStyle(3, 0xff88aa), this.add.rectangle(0, -24, 36, 12, 0xff2244).setStrokeStyle(2, 0xff88aa), this.add.rectangle(6, -4, 6, 6, 0xffff00)]);
      obstacle.height = 40;
    } else if (type === 1) {
      obstacle = this.add.container(W + 30, this.groundY - 40);
      obstacle.add([this.add.rectangle(0, 0, 24, 80, 0xffaa00).setStrokeStyle(3, 0xffdd44), this.add.rectangle(0, -44, 32, 14, 0xff8800).setStrokeStyle(2, 0xffdd44)]);
      obstacle.height = 80;
    } else {
      obstacle = this.add.container(W + 30, this.groundY - 120);
      obstacle.add([this.add.rectangle(0, 0, 44, 24, 0x44ff88).setStrokeStyle(3, 0x88ffaa), this.add.rectangle(-20, -10, 20, 10, 0x22cc66), this.add.rectangle(20, -10, 20, 10, 0x22cc66)]);
      obstacle.height = 24;
    }
    obstacle.setDepth(4); this.obstacles.push(obstacle);
  }

  jump() {
    if (!this.started || this.gameOver) return;
    if (this.isGround) { this.playerVY = -520; this.isGround = false; this.jumpCount = 1; this.cameras.main.shake(80, 0.002); }
    else if (this.jumpCount < 2) {
      this.playerVY = -420; this.jumpCount += 1;
      const effect = this.add.text(this.playerX, this.playerY - 20, '2x JUMP!', { fontSize: '8px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5).setDepth(10);
      this.tweens.add({ targets: effect, y: this.playerY - 60, alpha: 0, duration: 500, onComplete: () => effect.destroy() });
    }
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;
    const dt = delta / 1000;
    this.score += delta * 0.05;
    this.scoreTxt.setText(`SCORE: ${Math.floor(this.score)}`);
    this.speed = 300 + this.score * 0.3;
    this.stars.forEach((s) => { s.obj.x -= s.speed; if (s.obj.x < 0) s.obj.x = 800; });
    this.grounds.forEach((g) => { g.x -= this.speed * dt; if (g.x < -32) g.x += 26 * 32; });
    this.buildings.forEach((b) => { b.obj.x -= this.speed * 0.3 * dt; if (b.obj.x < -100) b.obj.x = 900; });
    this.playerVY += 1400 * dt; this.playerY += this.playerVY * dt;
    if (this.playerY >= this.groundY - 30) { this.playerY = this.groundY - 30; this.playerVY = 0; this.isGround = true; this.jumpCount = 0; }
    this.player.setY(this.playerY); this.legL.setY(this.playerY + 28); this.legR.setY(this.playerY + 28);
    if (this.isGround) { this.legAnim += delta * 0.01; this.legL.setY(this.playerY + 28 + Math.sin(this.legAnim) * 6); this.legR.setY(this.playerY + 28 + Math.sin(this.legAnim + Math.PI) * 6); }
    this.obstacles.forEach((obs, idx) => {
      obs.x -= this.speed * dt;
      if (Math.abs(this.playerX - obs.x) < 32 && Math.abs(this.playerY - obs.y) < 22 + obs.height / 2) { this.triggerGameOver(); return; }
      if (obs.x < -60) { obs.destroy(); this.obstacles.splice(idx, 1); }
    });
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.obstacleEvent) this.obstacleEvent.remove();
    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(300, 255, 0, 0, false);
    this.time.delayedCall(800, () => this.endGame());
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600, finalScore = Math.floor(this.score);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W / 2 + 3, H / 2 + 3, 620, 380, 0x000000, 0.8);
    this.add.rectangle(W / 2, H / 2, 620, 380, 0x0d1545);
    this.add.rectangle(W / 2, H / 2 - 188, 620, 4, 0xFFD700);
    this.add.rectangle(W / 2, H / 2 + 188, 620, 4, 0xFFD700);
    this.add.rectangle(W / 2 - 308, H / 2, 4, 380, 0xFFD700);
    this.add.rectangle(W / 2 + 308, H / 2, 4, 380, 0xFFD700);
    this.add.text(W / 2, 130, 'BUS RUNNER', { fontSize: '16px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 165, 'GAME OVER', { fontSize: '12px', color: '#ff4466', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 230, `${finalScore}`, { fontSize: '36px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 275, 'SCORE', { fontSize: '9px', color: '#888888', fontFamily: PF }).setOrigin(0.5);
    let grade = 'C', gradeColor = '#ff4466';
    if (finalScore >= 3000) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (finalScore >= 1500) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (finalScore >= 800) { grade = 'B'; gradeColor = '#4499ff'; }
    this.add.text(W / 2 + 160, 240, grade, { fontSize: '60px', color: gradeColor, fontFamily: PF }).setOrigin(0.5);
    const reward = finalScore >= 1500 ? 'AGI +7    GP +20' : 'AGI +3    GP +5';
    this.add.text(W / 2, 340, reward, { fontSize: '10px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 375, 'TIP: DOUBLE JUMP IS AVAILABLE!', { fontSize: '7px', color: '#445566', fontFamily: PF }).setOrigin(0.5);
    this.createBtn(270, 440, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 440, 'MENU', 0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.cameras.main.flash(150, 255, 255, 255, false); this.time.delayedCall(150, cb); });
  }
}
