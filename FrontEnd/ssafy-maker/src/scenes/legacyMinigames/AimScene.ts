// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

export default class AimScene extends Phaser.Scene {
  constructor() { super({ key: 'AimScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);
    const W = 800, H = 600;
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.missed = 0; this.hits = 0; this.timeLeft = 30; this.gameOver = false; this.targets = []; this.totalShots = 0;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    for (let x = 0; x < W; x += 40) this.add.rectangle(x, H / 2, 1, H, 0x112233, 0.5);
    for (let y = 0; y < H; y += 40) this.add.rectangle(W / 2, y, W, 1, 0x112233, 0.5);
    for (let i = 0; i < 25; i += 1) this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2), 0xffffff, 0.3);
    this.add.rectangle(W / 2, 25, W, 50, 0x0d1545, 0.95);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W / 2, 50, W, 3, 0xff4466);
    this.add.text(W / 2, 10, 'AIM TRAINER', { fontSize: '14px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5, 0);
    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', { fontSize: '9px', color: '#ffffff', fontFamily: PF });
    this.comboTxt = this.add.text(20, 30, '', { fontSize: '8px', color: '#FFD700', fontFamily: PF });
    this.timerTxt = this.add.text(W - 20, 12, 'TIME: 30', { fontSize: '9px', color: '#ff4466', fontFamily: PF }).setOrigin(1, 0);
    this.accuracyTxt = this.add.text(W - 20, 30, 'ACC: 100%', { fontSize: '8px', color: '#44ff88', fontFamily: PF }).setOrigin(1, 0);
    this.add.rectangle(W / 2, 47, W - 40, 5, 0x333355);
    this.timerBar = this.add.rectangle(20, 47, W - 40, 5, 0xff4466).setOrigin(0, 0.5);
    this.judgeTxt = this.add.text(W / 2, 300, '', { fontSize: '14px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.input.setDefaultCursor('none');
    this.crossH = this.add.rectangle(0, 0, 20, 2, 0xff4466).setDepth(20);
    this.crossV = this.add.rectangle(0, 0, 2, 20, 0xff4466).setDepth(20);
    this.crossCircle = this.add.circle(0, 0, 8).setStrokeStyle(2, 0xff4466).setDepth(20);
    this.input.on('pointermove', (pointer) => { this.crossH.setPosition(pointer.x, pointer.y); this.crossV.setPosition(pointer.x, pointer.y); this.crossCircle.setPosition(pointer.x, pointer.y); });
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      this.totalShots += 1;
      const hit = this.targets.some((t) => t && t.active && Phaser.Math.Distance.Between(pointer.x, pointer.y, t.x, t.y) < t.radius);
      if (!hit) {
        const miss = this.add.text(pointer.x, pointer.y, 'MISS', { fontSize: '8px', color: '#ff4466', fontFamily: PF }).setOrigin(0.5).setDepth(10);
        this.tweens.add({ targets: miss, y: pointer.y - 30, alpha: 0, duration: 400, onComplete: () => miss.destroy() });
        this.combo = 0; this.missed += 1; this.updateHUD();
      }
    });

    this.spawnTarget();
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });
  }

  spawnTarget() {
    if (this.gameOver) return;
    const W = 800, H = 600, x = Phaser.Math.Between(80, W - 80), y = Phaser.Math.Between(80, H - 80);
    const radius = Math.max(20, 45 - this.score * 0.02);
    const container = this.add.container(x, y); container.radius = radius;
    const outer = this.add.circle(0, 0, radius, 0xff4466, 0.2).setStrokeStyle(3, 0xff4466);
    const mid = this.add.circle(0, 0, radius * 0.6, 0xff8888, 0.3).setStrokeStyle(2, 0xff8888);
    const center = this.add.circle(0, 0, radius * 0.25, 0xffffff);
    const ch = this.add.rectangle(0, 0, radius * 2, 2, 0xff4466, 0.5);
    const cv = this.add.rectangle(0, 0, 2, radius * 2, 0xff4466, 0.5);
    container.add([ch, cv, outer, mid, center]); container.setDepth(5);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
    container.setScale(0);
    this.tweens.add({ targets: container, scale: 1, duration: 150, ease: 'Back.easeOut' });
    const lifeTime = Math.max(1200, 2500 - this.score * 1.5);
    const shrinkTween = this.tweens.add({ targets: outer, scaleX: 0, scaleY: 0, duration: lifeTime, ease: 'Linear' });
    const lifeTimer = this.time.delayedCall(lifeTime, () => {
      if (container.active) {
        this.tweens.add({ targets: container, alpha: 0, scale: 0, duration: 150, onComplete: () => container.destroy() });
        this.targets = this.targets.filter((t) => t !== container); this.combo = 0; this.missed += 1; this.updateHUD(); this.spawnTarget();
      }
    });
    container.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      lifeTimer.remove(); shrinkTween.stop();
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, container.x, container.y);
      const distRatio = dist / radius;
      let pts = 100, judgeText = 'HIT', judgeColor = '#4499ff';
      if (distRatio < 0.25) { pts = 500; judgeText = 'HEADSHOT!'; judgeColor = '#FFD700'; this.cameras.main.flash(80, 255, 200, 0, false); }
      else if (distRatio < 0.6) { pts = 300; judgeText = 'GREAT!'; judgeColor = '#44ff88'; }
      this.combo += 1; this.maxCombo = Math.max(this.maxCombo, this.combo); this.hits += 1;
      if (this.combo >= 5) pts = Math.floor(pts * 1.5);
      if (this.combo >= 10) pts = Math.floor(pts * 2);
      this.score += pts;
      const popup = this.add.text(container.x, container.y - 20, `+${pts}`, { fontSize: '11px', color: judgeColor, fontFamily: PF }).setOrigin(0.5).setDepth(10);
      this.tweens.add({ targets: popup, y: container.y - 70, alpha: 0, duration: 500, onComplete: () => popup.destroy() });
      this.showJudge(judgeText, judgeColor); this.hitEffect(container.x, container.y, judgeColor);
      container.destroy(); this.targets = this.targets.filter((t) => t !== container); this.updateHUD(); this.time.delayedCall(100, () => this.spawnTarget());
    });
    container.on('pointerover', () => this.crossCircle.setStrokeStyle(2, 0xFFD700));
    container.on('pointerout', () => this.crossCircle.setStrokeStyle(2, 0xff4466));
    this.targets.push(container);
  }

  hitEffect(x, y, color) {
    const colorNum = parseInt(color.replace('#', ''), 16);
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const p = this.add.rectangle(x, y, 5, 5, colorNum).setDepth(8);
      this.tweens.add({ targets: p, x: x + Math.cos(angle) * 50, y: y + Math.sin(angle) * 50, alpha: 0, scale: 0, duration: 350, ease: 'Power2', onComplete: () => p.destroy() });
    }
  }

  showJudge(text, color) {
    this.judgeTxt.setText(text).setColor(color).setAlpha(1).setY(320);
    this.tweens.add({ targets: this.judgeTxt, alpha: 0, y: 290, duration: 600, ease: 'Power2' });
  }

  updateHUD() {
    this.scoreTxt.setText(`SCORE: ${this.score}`);
    this.comboTxt.setText(this.combo > 1 ? `${this.combo} COMBO!` : '');
    const acc = this.totalShots > 0 ? Math.floor((this.hits / this.totalShots) * 100) : 100;
    this.accuracyTxt.setText(`ACC: ${acc}%`);
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft -= 1;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);
    const ratio = this.timeLeft / 30;
    this.timerBar.setScale(ratio, 1);
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff4466);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    if (this.timeLeft <= 0) { this.gameOver = true; this.timerEvent.remove(); this.input.setDefaultCursor('default'); this.time.delayedCall(500, () => this.endGame()); }
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W / 2 + 3, H / 2 + 3, 620, 400, 0x000000, 0.8);
    this.add.rectangle(W / 2, H / 2, 620, 400, 0x0d1545);
    this.add.rectangle(W / 2, H / 2 - 198, 620, 4, 0xFFD700);
    this.add.rectangle(W / 2, H / 2 + 198, 620, 4, 0xFFD700);
    this.add.rectangle(W / 2 - 308, H / 2, 4, 400, 0xFFD700);
    this.add.rectangle(W / 2 + 308, H / 2, 4, 400, 0xFFD700);
    this.add.text(W / 2, 120, 'AIM TRAINER', { fontSize: '16px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 152, 'RESULT', { fontSize: '10px', color: '#888888', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 210, `${this.score}`, { fontSize: '34px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    const acc = this.totalShots > 0 ? Math.floor((this.hits / this.totalShots) * 100) : 0;
    [{ label: 'ACCURACY', value: `${acc}%`, color: '#44ff88' }, { label: 'MAX COMBO', value: this.maxCombo, color: '#FFD700' }, { label: 'HITS', value: this.hits, color: '#4499ff' }, { label: 'MISSED', value: this.missed, color: '#ff4466' }].forEach((s, i) => {
      this.add.text(W / 2 - 150, 275 + i * 38, s.label, { fontSize: '8px', color: '#888888', fontFamily: PF }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 150, 275 + i * 38, String(s.value), { fontSize: '10px', color: s.color, fontFamily: PF }).setOrigin(1, 0.5);
    });
    let grade = 'C', gradeColor = '#ff4466';
    if (acc >= 90) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (acc >= 75) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (acc >= 55) { grade = 'B'; gradeColor = '#4499ff'; }
    this.add.text(W / 2 + 190, 290, grade, { fontSize: '60px', color: gradeColor, fontFamily: PF }).setOrigin(0.5);
    const reward = acc >= 75 ? 'AGI +7    GP +20' : 'AGI +3    GP +5';
    this.add.text(W / 2, 435, reward, { fontSize: '10px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);
    this.createBtn(270, 490, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 490, 'MENU', 0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.input.setDefaultCursor('default'); this.cameras.main.flash(150, 255, 255, 255, false); this.time.delayedCall(150, cb); });
  }
}
