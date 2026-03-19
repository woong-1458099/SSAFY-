// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

export default class TankScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TankScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.gameOver = false;
    this.started = false;
    this.score = 0;
    this.spawnTimer = 0;
    this.bullets = [];
    this.enemies = [];

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    // Grid pattern
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a4e, 0.3);
    for (let i = 0; i < W; i += 40) grid.lineBetween(i, 0, i, H);
    for (let i = 0; i < H; i += 40) grid.lineBetween(0, i, W, i);

    // UI
    this.add.rectangle(W / 2, 25, W, 50, 0x1a1a1a, 0.95);
    this.add.text(W / 2, 15, '🎮 탱크 워', { fontSize: '18px', color: '#88ff00', fontFamily: PF }).setOrigin(0.5);
    this.scoreTxt = this.add.text(20, 35, 'SCORE: 0', { fontSize: '11px', color: '#ffffff', fontFamily: PF });
    this.hintTxt = this.add.text(W / 2, H - 25, 'WASD: 이동 | 클릭: 발사', { fontSize: '10px', color: '#88ff88', fontFamily: PF }).setOrigin(0.5);

    // Player Tank
    this.player = this.add.container(W / 2, H / 2);
    const tankBody = this.add.rectangle(0, 0, 40, 48, 0x334400).setStrokeStyle(3, 0x88ff00);
    const tankTrackL = this.add.rectangle(-22, 0, 8, 52, 0x222200).setStrokeStyle(1, 0x556600);
    const tankTrackR = this.add.rectangle(22, 0, 8, 52, 0x222200).setStrokeStyle(1, 0x556600);
    const tankTop = this.add.circle(0, 0, 14, 0x445500).setStrokeStyle(2, 0x88ff00);
    this.turret = this.add.rectangle(0, -30, 8, 36, 0x556622).setOrigin(0.5, 1).setStrokeStyle(2, 0xaaff44);
    this.player.add([tankTrackL, tankTrackR, tankBody, tankTop, this.turret]);
    this.player.setDepth(10);

    this.playerVX = 0;
    this.playerVY = 0;

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');

    // Mouse fire
    this.input.on('pointerdown', () => {
      if (this.started && !this.gameOver) this.fireBullet();
    });

    this.showCountdown();
  }

  showCountdown() {
    let count = 3;
    const countTxt = this.add.text(W / 2, H / 2, '3', { fontSize: '72px', color: '#88ff00', fontFamily: PF }).setOrigin(0.5).setDepth(100);

    this.time.addEvent({
      delay: 800,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countTxt.setText(count.toString());
          this.tweens.add({ targets: countTxt, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
        } else {
          countTxt.setText('FIGHT!').setColor('#ffff00');
          this.tweens.add({
            targets: countTxt,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 400,
            onComplete: () => {
              countTxt.destroy();
              this.started = true;
              this.hintTxt.setVisible(false);
            }
          });
        }
      }
    });
  }

  fireBullet() {
    const angle = this.turret.rotation - Math.PI / 2;
    const bx = this.player.x + Math.cos(angle) * 40;
    const by = this.player.y + Math.sin(angle) * 40;

    const bullet = this.add.container(bx, by);
    const bulletBody = this.add.rectangle(0, 0, 6, 14, 0xffff00).setStrokeStyle(1, 0xffffaa);
    bullet.add(bulletBody);
    bullet.rotation = angle + Math.PI / 2;
    bullet.setData('vx', Math.cos(angle) * 600);
    bullet.setData('vy', Math.sin(angle) * 600);
    bullet.setDepth(5);

    this.bullets.push(bullet);

    // Muzzle flash
    const flash = this.add.circle(bx, by, 12, 0xffff88, 0.8);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 100, onComplete: () => flash.destroy() });

    this.cameras.main.shake(30, 0.003);
  }

  spawnEnemy() {
    const side = Phaser.Math.Between(0, 3);
    let x, y;

    if (side === 0) { x = Phaser.Math.Between(50, W - 50); y = -40; }
    else if (side === 1) { x = W + 40; y = Phaser.Math.Between(50, H - 50); }
    else if (side === 2) { x = Phaser.Math.Between(50, W - 50); y = H + 40; }
    else { x = -40; y = Phaser.Math.Between(50, H - 50); }

    const enemy = this.add.container(x, y);
    const body = this.add.rectangle(0, 0, 32, 32, 0x441100).setStrokeStyle(2, 0xff4400);
    const core = this.add.circle(0, 0, 8, 0xff6600);
    enemy.add([body, core]);
    enemy.setData('hp', 1);
    enemy.setDepth(4);

    // Rotate toward player
    const angle = Phaser.Math.Angle.Between(x, y, this.player.x, this.player.y);
    enemy.rotation = angle + Math.PI / 2;

    const speed = 80 + Math.min(this.score, 200);
    enemy.setData('vx', Math.cos(angle) * speed);
    enemy.setData('vy', Math.sin(angle) * speed);

    this.enemies.push(enemy);
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;

    const dt = delta / 1000;
    const speed = 200;

    // Turret follows mouse
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.input.activePointer.x, this.input.activePointer.y);
    this.turret.rotation = angle + Math.PI / 2;

    // Player movement
    let vx = 0, vy = 0;
    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -speed;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = speed;
    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -speed;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = speed;

    this.player.x += vx * dt;
    this.player.y += vy * dt;

    // Clamp player position
    this.player.x = Phaser.Math.Clamp(this.player.x, 40, W - 40);
    this.player.y = Phaser.Math.Clamp(this.player.y, 60, H - 40);

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.getData('vx') * dt;
      bullet.y += bullet.getData('vy') * dt;

      // Remove if out of bounds
      if (bullet.x < -20 || bullet.x > W + 20 || bullet.y < -20 || bullet.y > H + 20) {
        bullet.destroy();
        this.bullets.splice(i, 1);
        continue;
      }

      // Check enemy collision
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < 25) {
          // Hit!
          bullet.destroy();
          this.bullets.splice(i, 1);

          this.tweens.add({
            targets: enemy,
            scaleX: 1.5, scaleY: 1.5, alpha: 0,
            duration: 100,
            onComplete: () => enemy.destroy()
          });
          this.enemies.splice(j, 1);

          this.score += 10;
          this.scoreTxt.setText(`SCORE: ${this.score}`);
          this.cameras.main.shake(50, 0.005);

          // Explosion effect
          const exp = this.add.circle(enemy.x, enemy.y, 20, 0xff8800, 0.8);
          this.tweens.add({ targets: exp, scaleX: 2, scaleY: 2, alpha: 0, duration: 200, onComplete: () => exp.destroy() });

          break;
        }
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Re-target player
      const toPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const speed = 80 + Math.min(this.score, 200);
      enemy.setData('vx', Math.cos(toPlayer) * speed);
      enemy.setData('vy', Math.sin(toPlayer) * speed);
      enemy.rotation = toPlayer + Math.PI / 2;

      enemy.x += enemy.getData('vx') * dt;
      enemy.y += enemy.getData('vy') * dt;

      // Check player collision
      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (dist < 35) {
        this.triggerGameOver();
        return;
      }
    }

    // Enemy spawning
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(400, 1800 - this.score * 8);
    }
  }

  triggerGameOver() {
    this.gameOver = true;
    this.cameras.main.flash(300, 255, 50, 0);
    this.cameras.main.shake(500, 0.02);

    // Explosion on player
    const exp = this.add.circle(this.player.x, this.player.y, 30, 0xff4400, 1);
    this.tweens.add({ targets: exp, scaleX: 3, scaleY: 3, alpha: 0, duration: 500 });

    this.time.delayedCall(1000, () => this.endGame());
  }

  endGame() {
    this.children.removeAll();
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a1a);

    this.add.text(W / 2, H / 2 - 80, '💥 GAME OVER', { fontSize: '42px', color: '#ff4400', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 20, `최종 점수: ${this.score}`, { fontSize: '24px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 30, '보상: 집중 +10, GP +40', { fontSize: '14px', color: '#88ff00', fontFamily: PF }).setOrigin(0.5);

    this.createBtn(W / 2 - 130, H / 2 + 100, '다시하기', 0x332200, 0x88ff00, () => this.scene.restart());
    this.createBtn(W / 2 + 130, H / 2 + 100, '메뉴', 0x222222, 0x666666, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => cb());
  }

  shutdown() {
    // 입력 이벤트 정리
    this.input.off('pointerdown');

    // 키보드 리스너 정리
    if (this.keys) {
      this.input.keyboard.removeKey('W');
      this.input.keyboard.removeKey('A');
      this.input.keyboard.removeKey('S');
      this.input.keyboard.removeKey('D');
    }
    if (this.cursors) {
      this.cursors.up.destroy();
      this.cursors.down.destroy();
      this.cursors.left.destroy();
      this.cursors.right.destroy();
    }

    // 배열 정리
    this.bullets = [];
    this.enemies = [];
  }
}
