// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

const pocketPositions = [
  { x: 35, y: 35 }, { x: W / 2, y: 30 }, { x: W - 35, y: 35 },
  { x: 35, y: H - 35 }, { x: W / 2, y: H - 30 }, { x: W - 35, y: H - 35 }
];

export default class BilliardsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BilliardsScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.gameOver = false;
    this.score = 0;
    this.targetBallsCount = 0;
    this.balls = [];

    // Background (Table)
    this.add.rectangle(W / 2, H / 2, W, H, 0x006633);

    // Borders
    const borderThickness = 30;
    this.add.rectangle(W / 2, borderThickness / 2, W, borderThickness, 0x4a2810);
    this.add.rectangle(W / 2, H - borderThickness / 2, W, borderThickness, 0x4a2810);
    this.add.rectangle(borderThickness / 2, H / 2, borderThickness, H, 0x4a2810);
    this.add.rectangle(W - borderThickness / 2, H / 2, borderThickness, H, 0x4a2810);

    // Inner border line
    const g = this.add.graphics();
    g.lineStyle(3, 0x228833);
    g.strokeRect(borderThickness + 5, borderThickness + 5, W - (borderThickness + 5) * 2, H - (borderThickness + 5) * 2);

    // Pockets
    pocketPositions.forEach(pos => {
      this.add.circle(pos.x, pos.y, 22, 0x000000);
    });

    // UI
    this.add.rectangle(W / 2, 25, W, 50, 0x002200, 0.9);
    this.add.text(W / 2, 15, '🎱 당구 챌린지', { fontSize: '18px', color: '#00ff44', fontFamily: PF }).setOrigin(0.5);
    this.scoreTxt = this.add.text(20, 35, '남은 공: 10', { fontSize: '11px', color: '#ffffff', fontFamily: PF });
    this.hintTxt = this.add.text(W / 2, H - 20, '흰 공을 드래그해서 쏘세요!', { fontSize: '10px', color: '#88ff88', fontFamily: PF }).setOrigin(0.5);

    // Target Balls (triangle formation)
    const ballColors = [0xff0000, 0xffff00, 0x0000ff, 0xff8800, 0x8800ff, 0x00ffff, 0xff00ff, 0x222222, 0xff4488, 0x44ff88];
    const startX = 550;
    const startY = H / 2;
    const spacing = 26;

    let ballIdx = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col <= row; col++) {
        const bx = startX + row * spacing * 0.9;
        const by = startY - (row * spacing / 2) + col * spacing;
        this.createBall(bx, by, ballColors[ballIdx % ballColors.length], false);
        ballIdx++;
        this.targetBallsCount++;
      }
    }

    // Cue Ball (white)
    this.cueBall = this.createBall(180, H / 2, 0xffffff, true);

    // Interaction
    this.isDragging = false;
    this.line = this.add.graphics();
    this.powerBar = this.add.graphics();

    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
      if (dist < 40 && this.cueBall.getData('speed') < 5) {
        this.isDragging = true;
        this.hintTxt.setVisible(false);
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this.isDragging) {
        this.line.clear();
        this.powerBar.clear();

        // Aim line
        this.line.lineStyle(2, 0xffffff, 0.6);
        this.line.lineBetween(this.cueBall.x, this.cueBall.y, pointer.x, pointer.y);

        // Direction indicator
        const angle = Phaser.Math.Angle.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
        this.line.lineStyle(3, 0x00ff00, 0.4);
        this.line.lineBetween(
          this.cueBall.x, this.cueBall.y,
          this.cueBall.x + Math.cos(angle) * 120,
          this.cueBall.y + Math.sin(angle) * 120
        );

        // Power bar
        const dist = Math.min(Phaser.Math.Distance.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y), 200);
        const power = dist / 200;
        this.powerBar.fillStyle(Phaser.Display.Color.GetColor(255 * power, 255 * (1 - power), 0));
        this.powerBar.fillRect(20, H - 40, 150 * power, 15);
        this.powerBar.lineStyle(2, 0xffffff);
        this.powerBar.strokeRect(20, H - 40, 150, 15);
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.line.clear();
        this.powerBar.clear();

        const angle = Phaser.Math.Angle.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
        const power = Math.min(dist * 4, 800);

        this.cueBall.setData('vx', Math.cos(angle) * power);
        this.cueBall.setData('vy', Math.sin(angle) * power);
        this.cueBall.setData('speed', power);

        this.cameras.main.shake(50, 0.003);
      }
    });
  }

  createBall(x, y, color, isCue) {
    const ball = this.add.container(x, y);
    const circle = this.add.circle(0, 0, 12, color);
    circle.setStrokeStyle(2, isCue ? 0xcccccc : 0x000000);

    // Shine effect
    const shine = this.add.circle(-4, -4, 4, 0xffffff, 0.4);
    ball.add([circle, shine]);

    ball.setData('vx', 0);
    ball.setData('vy', 0);
    ball.setData('speed', 0);
    ball.setData('isCue', isCue);
    ball.setData('radius', 12);

    this.balls.push(ball);
    return ball;
  }

  update(time, delta) {
    if (this.gameOver) return;

    const dt = delta / 1000;
    const friction = 0.985;
    const border = 42;

    // Update ball positions
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (!ball.active) continue;

      let vx = ball.getData('vx') * friction;
      let vy = ball.getData('vy') * friction;

      // Stop if very slow
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed < 3) {
        vx = 0;
        vy = 0;
      }

      ball.x += vx * dt;
      ball.y += vy * dt;

      // Wall collision
      if (ball.x < border) { ball.x = border; vx = -vx * 0.8; }
      if (ball.x > W - border) { ball.x = W - border; vx = -vx * 0.8; }
      if (ball.y < border) { ball.y = border; vy = -vy * 0.8; }
      if (ball.y > H - border) { ball.y = H - border; vy = -vy * 0.8; }

      ball.setData('vx', vx);
      ball.setData('vy', vy);
      ball.setData('speed', Math.sqrt(vx * vx + vy * vy));

      // Pocket check
      for (const pocket of pocketPositions) {
        const dist = Phaser.Math.Distance.Between(ball.x, ball.y, pocket.x, pocket.y);
        if (dist < 20) {
          if (ball.getData('isCue')) {
            // Reset cue ball
            ball.x = 180;
            ball.y = H / 2;
            ball.setData('vx', 0);
            ball.setData('vy', 0);
            ball.setData('speed', 0);
            this.cameras.main.shake(100, 0.01);
          } else {
            // Remove target ball
            this.tweens.add({
              targets: ball,
              scaleX: 0, scaleY: 0,
              duration: 150,
              onComplete: () => ball.destroy()
            });
            this.balls.splice(i, 1);
            this.score++;
            this.scoreTxt.setText(`남은 공: ${this.targetBallsCount - this.score}`);

            if (this.score >= this.targetBallsCount) {
              this.triggerWin();
            }
          }
          break;
        }
      }
    }

    // Ball-to-ball collision
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i];
        const b = this.balls[j];
        if (!a.active || !b.active) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 24;

        if (dist < minDist && dist > 0) {
          // Separate balls
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          // Exchange velocities along collision normal
          const avx = a.getData('vx');
          const avy = a.getData('vy');
          const bvx = b.getData('vx');
          const bvy = b.getData('vy');

          const dvx = avx - bvx;
          const dvy = avy - bvy;
          const dvn = dvx * nx + dvy * ny;

          if (dvn > 0) {
            a.setData('vx', avx - dvn * nx * 0.9);
            a.setData('vy', avy - dvn * ny * 0.9);
            b.setData('vx', bvx + dvn * nx * 0.9);
            b.setData('vy', bvy + dvn * ny * 0.9);
          }
        }
      }
    }
  }

  triggerWin() {
    this.gameOver = true;
    this.time.delayedCall(500, () => this.endGame(true));
  }

  endGame(won) {
    this.children.removeAll();
    this.add.rectangle(W / 2, H / 2, W, H, 0x002200);

    if (won) {
      this.add.text(W / 2, H / 2 - 60, '🎱 클리어!', { fontSize: '36px', color: '#00ff44', fontFamily: PF }).setOrigin(0.5);
      this.add.text(W / 2, H / 2, '모든 공을 넣었습니다!', { fontSize: '16px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 40, '보상: 민첩 +10, GP +30', { fontSize: '14px', color: '#ffff00', fontFamily: PF }).setOrigin(0.5);
    }

    this.createBtn(W / 2, H / 2 + 120, '메뉴로 돌아가기', 0x004411, 0x00ff44, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 240, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => cb());
  }

  shutdown() {
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');
  }
}
