// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';
import { emitMinigameReward } from '@features/minigame/minigameRewardEvents';
import {
  LEGACY_TANK_ENDINGS,
  LEGACY_TANK_INITIAL_LIVES,
  LEGACY_TANK_INITIAL_PLAYER_AIM_ANGLE,
  LEGACY_TANK_SHOOT_COOLDOWN_MS
} from '@features/minigame/legacy/legacyTankConfig';
import { SCREEN, PIXEL_FONT, COLORS, createBackground, createGridBackground, createPanel, createButton } from './utils';

const { W, H } = SCREEN;

export default class TankScene extends Phaser.Scene {
  private returnSceneKey = 'main';
  private completedRewardText = null;
  private rewardEmitted = false;

  constructor() {
    super({ key: 'TankScene' });
  }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'main';
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    this.gameOver = false;
    this.started = false;
    this.completedRewardText = null;
    this.rewardEmitted = false;
    this.playerLives = LEGACY_TANK_INITIAL_LIVES;
    this.enemyLives = LEGACY_TANK_INITIAL_LIVES;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.lastPlayerShot = 0;
    this.lastEnemyShot = 0;
    this.shootCooldown = LEGACY_TANK_SHOOT_COOLDOWN_MS;
    this.playerAimAngle = LEGACY_TANK_INITIAL_PLAYER_AIM_ANGLE; // 초기: 위쪽

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    // Grid pattern
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a4e, 0.3);
    for (let i = 0; i < W; i += 40) grid.lineBetween(i, 0, i, H);
    for (let i = 0; i < H; i += 40) grid.lineBetween(0, i, W, i);

    // Center dividing line
    this.add.rectangle(W / 2, H / 2, W - 40, 4, 0x444488, 0.5);

    // Arena border
    const border = this.add.graphics();
    border.lineStyle(4, 0x88ff00);
    border.strokeRect(20, 20, W - 40, H - 40);

    // UI - Player lives (bottom left)
    this.add.text(30, H - 35, 'PLAYER', { fontSize: '10px', color: '#44aaff', fontFamily: PIXEL_FONT });
    this.playerLivesIcons = [];
    for (let i = 0; i < LEGACY_TANK_INITIAL_LIVES; i++) {
      const heart = this.add.text(100 + i * 25, H - 38, '❤️', { fontSize: '14px' });
      this.playerLivesIcons.push(heart);
    }

    // UI - Enemy lives (top right) - 6 hearts for 3 tanks x 2 lives
    this.add.text(W - 220, 15, 'ENEMY', { fontSize: '10px', color: '#ff4466', fontFamily: PIXEL_FONT });
    this.enemyLivesIcons = [];
    for (let i = 0; i < 6; i++) {
      const heart = this.add.text(W - 150 + i * 22, 12, '❤️', { fontSize: '12px' });
      this.enemyLivesIcons.push(heart);
    }

    // Title
    this.add.text(W / 2, 15, '🎮 탱크 배틀', { fontSize: '16px', color: '#88ff00', fontFamily: PIXEL_FONT }).setOrigin(0.5);

    // Hint
    this.hintTxt = this.add.text(W / 2, H - 18, 'WASD: 이동 | 마우스: 조준 & 클릭 발사', { fontSize: '10px', color: '#88ff88', fontFamily: PIXEL_FONT }).setOrigin(0.5);

    // Create Player Tank (bottom - Blue/Green)
    this.player = this.createTank(W / 2, H - 100, 0x334400, 0x88ff00, true);

    // Create Enemy Tanks (top - Red) - 3대
    this.enemies = [];
    const enemyPositions = [
      { x: W / 4, y: 100 },
      { x: W / 2, y: 120 },
      { x: W * 3 / 4, y: 100 }
    ];
    for (let i = 0; i < 3; i++) {
      const enemy = this.createTank(enemyPositions[i].x, enemyPositions[i].y, 0x440000, 0xff4466, false);
      enemy.setData('targetX', enemyPositions[i].x);
      enemy.setData('targetY', enemyPositions[i].y);
      enemy.setData('moveTimer', Phaser.Math.Between(0, 1000));
      enemy.setData('lives', 2); // 각 적 탱크 체력 2
      this.enemies.push(enemy);
    }
    this.enemyLives = 6; // 총 적 체력 (3대 x 2)

    // Controls
    this.keys = this.input.keyboard.addKeys('W,A,S,D');

    // Mouse click to fire
    this.input.on('pointerdown', () => {
      if (this.started && !this.gameOver) this.playerFire();
    });

    // 씬 종료 시 정리
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);

    this.showCountdown();
  }

  createTank(x, y, bodyColor, accentColor, isPlayer) {
    const tank = this.add.container(x, y);

    const trackL = this.add.rectangle(-18, 0, 8, 44, 0x222200).setStrokeStyle(1, accentColor);
    const trackR = this.add.rectangle(18, 0, 8, 44, 0x222200).setStrokeStyle(1, accentColor);
    const body = this.add.rectangle(0, 0, 32, 40, bodyColor).setStrokeStyle(3, accentColor);
    const top = this.add.circle(0, 0, 12, bodyColor).setStrokeStyle(2, accentColor);
    const turret = this.add.rectangle(0, -24, 6, 28, accentColor).setOrigin(0.5, 1);

    tank.add([trackL, trackR, body, top, turret]);
    tank.setDepth(10);
    tank.setData('turret', turret);
    tank.setData('isPlayer', isPlayer);
    tank.setData('invincible', false);

    return tank;
  }

  showCountdown() {
    let count = 3;
    const countTxt = this.add.text(W / 2, H / 2, '3', { fontSize: '72px', color: '#88ff00', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(100);

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
            alpha: 0, scaleX: 2, scaleY: 2,
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

  playerFire() {
    const now = this.time.now;
    if (now - this.lastPlayerShot < this.shootCooldown) return;
    this.lastPlayerShot = now;

    this.fireBullet(this.player.x, this.player.y, this.playerAimAngle, true);
  }

  enemyFire(enemy) {
    if (!enemy || !enemy.active) return;

    const now = this.time.now;
    const lastShot = enemy.getData('lastShot') || 0;
    if (now - lastShot < this.shootCooldown * 2) return;
    enemy.setData('lastShot', now);

    // Enemy aims at player
    const aimAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
    this.fireBullet(enemy.x, enemy.y, aimAngle, false);
  }

  fireBullet(x, y, angle, isPlayer) {
    const bx = x + Math.cos(angle) * 35;
    const by = y + Math.sin(angle) * 35;

    const bullet = this.add.container(bx, by);
    const bulletBody = this.add.rectangle(0, 0, 6, 12, isPlayer ? 0x88ff00 : 0xff4466);
    bulletBody.setStrokeStyle(1, isPlayer ? 0xaaffaa : 0xffaaaa);
    bullet.add(bulletBody);
    bullet.rotation = angle + Math.PI / 2;
    bullet.setData('vx', Math.cos(angle) * 450);
    bullet.setData('vy', Math.sin(angle) * 450);
    bullet.setData('isPlayer', isPlayer);
    bullet.setDepth(5);

    if (isPlayer) {
      this.playerBullets.push(bullet);
    } else {
      this.enemyBullets.push(bullet);
    }

    // Muzzle flash
    const flash = this.add.circle(bx, by, 10, isPlayer ? 0xaaffaa : 0xffaaaa, 0.8);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 80, onComplete: () => flash.destroy() });

    this.cameras.main.shake(20, 0.002);
  }

  updateAI(dt) {
    if (this.gameOver) return;

    this.enemies.forEach((enemy) => {
      if (!enemy.active) return;

      // Move AI randomly in top half
      let moveTimer = enemy.getData('moveTimer') - dt * 1000;
      if (moveTimer <= 0) {
        enemy.setData('targetX', Phaser.Math.Between(80, W - 80));
        enemy.setData('targetY', Phaser.Math.Between(80, H / 2 - 60));
        moveTimer = Phaser.Math.Between(1000, 2500);
      }
      enemy.setData('moveTimer', moveTimer);

      // Move toward target
      const targetX = enemy.getData('targetX');
      const targetY = enemy.getData('targetY');
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 10) {
        const speed = 80;
        enemy.x += (dx / dist) * speed * dt;
        enemy.y += (dy / dist) * speed * dt;
      }

      // Clamp position (top half)
      enemy.x = Phaser.Math.Clamp(enemy.x, 50, W - 50);
      enemy.y = Phaser.Math.Clamp(enemy.y, 50, H / 2 - 40);

      // Aim turret at player
      const turret = enemy.getData('turret');
      const aimAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      turret.rotation = aimAngle + Math.PI / 2;

      // Fire at player periodically
      if (Phaser.Math.Between(0, 100) < 2) {
        this.enemyFire(enemy);
      }
    });
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;

    const dt = delta / 1000;
    const speed = 160;

    // Player turret aiming with mouse (카메라 변환 적용)
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.playerAimAngle = Phaser.Math.Angle.Between(
      this.player.x, this.player.y, worldPoint.x, worldPoint.y
    );

    // Update player turret visual
    const turret = this.player.getData('turret');
    turret.rotation = this.playerAimAngle + Math.PI / 2;

    // Player movement with WASD
    let vx = 0, vy = 0;
    if (this.keys.W.isDown) vy = -speed;
    else if (this.keys.S.isDown) vy = speed;
    if (this.keys.A.isDown) vx = -speed;
    else if (this.keys.D.isDown) vx = speed;

    this.player.x += vx * dt;
    this.player.y += vy * dt;

    // Clamp player position (bottom half)
    this.player.x = Phaser.Math.Clamp(this.player.x, 50, W - 50);
    this.player.y = Phaser.Math.Clamp(this.player.y, H / 2 + 40, H - 50);

    // Update AI
    this.updateAI(dt);

    // Update player bullets (check against all enemies)
    this.updatePlayerBullets(dt);

    // Update enemy bullets
    this.updateBullets(this.enemyBullets, this.player, true, dt);
  }

  updatePlayerBullets(dt) {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.getData('vx') * dt;
      bullet.y += bullet.getData('vy') * dt;

      // Remove if out of bounds
      if (bullet.x < 10 || bullet.x > W - 10 || bullet.y < 10 || bullet.y > H - 10) {
        bullet.destroy();
        this.playerBullets.splice(i, 1);
        continue;
      }

      // Check collision with each enemy
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.getData('invincible')) continue;

        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < 28) {
          bullet.destroy();
          this.playerBullets.splice(i, 1);
          this.hitEnemy(enemy);
          break;
        }
      }
    }
  }

  updateBullets(bullets, target, targetIsPlayer, dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.x += bullet.getData('vx') * dt;
      bullet.y += bullet.getData('vy') * dt;

      // Remove if out of bounds
      if (bullet.x < 10 || bullet.x > W - 10 || bullet.y < 10 || bullet.y > H - 10) {
        bullet.destroy();
        bullets.splice(i, 1);
        continue;
      }

      // Check collision with target
      if (!target.getData('invincible')) {
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, target.x, target.y);
        if (dist < 28) {
          bullet.destroy();
          bullets.splice(i, 1);
          this.hitTank(target, targetIsPlayer);
          break;
        }
      }
    }
  }

  hitEnemy(enemy) {
    // Explosion effect
    const exp = this.add.circle(enemy.x, enemy.y, 25, 0xff8800, 0.9);
    this.tweens.add({ targets: exp, scaleX: 2, scaleY: 2, alpha: 0, duration: 300, onComplete: () => exp.destroy() });

    this.cameras.main.shake(150, 0.015);

    // Reduce enemy lives
    let lives = enemy.getData('lives') - 1;
    enemy.setData('lives', lives);
    this.enemyLives--;

    // Update UI
    if (this.enemyLives >= 0 && this.enemyLivesIcons[this.enemyLives]) {
      this.enemyLivesIcons[this.enemyLives].setText('🖤');
    }

    if (lives <= 0) {
      // Destroy this enemy tank
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        onComplete: () => {
          enemy.setActive(false);
          enemy.setVisible(false);
        }
      });
    } else {
      // Flash tank (still alive)
      enemy.setData('invincible', true);
      this.tweens.add({
        targets: enemy,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          enemy.setAlpha(1);
          enemy.setData('invincible', false);
        }
      });
    }

    // Check game over
    if (this.enemyLives <= 0) {
      this.triggerGameOver(true);
    }
  }

  hitTank(tank, isPlayer) {
    // Explosion effect
    const exp = this.add.circle(tank.x, tank.y, 25, 0xff8800, 0.9);
    this.tweens.add({ targets: exp, scaleX: 2, scaleY: 2, alpha: 0, duration: 300, onComplete: () => exp.destroy() });

    this.cameras.main.shake(150, 0.015);

    // Flash tank
    tank.setData('invincible', true);
    this.tweens.add({
      targets: tank,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        tank.setAlpha(1);
        tank.setData('invincible', false);
      }
    });

    if (isPlayer) {
      this.playerLives--;
      if (this.playerLives >= 0 && this.playerLivesIcons[this.playerLives]) {
        this.playerLivesIcons[this.playerLives].setText('🖤');
      }
      // Reset player position
      this.player.x = W / 2;
      this.player.y = H - 100;

      // Check game over
      if (this.playerLives <= 0) {
        this.triggerGameOver(false);
      }
    }
  }

  triggerGameOver(playerWon) {
    this.gameOver = true;
    this.cameras.main.flash(400, playerWon ? 100 : 255, playerWon ? 255 : 50, playerWon ? 100 : 0);

    this.time.delayedCall(1000, () => this.endGame(playerWon));
  }

  endGame(playerWon) {
    this.children.removeAll();
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a1a);

    const ending = playerWon ? LEGACY_TANK_ENDINGS.victory : LEGACY_TANK_ENDINGS.defeat;
    this.completedRewardText = ending.reward;
    this.add.text(W / 2, H / 2 - 80, ending.title, { fontSize: '42px', color: ending.titleColor, fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 20, ending.subtitle, { fontSize: '16px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 30, ending.reward, { fontSize: '14px', color: ending.rewardColor, fontFamily: PIXEL_FONT }).setOrigin(0.5);

    this.createBtn(W / 2 - 130, H / 2 + 100, '다시하기', 0x332200, 0x88ff00, () => this.scene.restart());
    this.createBtn(W / 2 + 130, H / 2 + 100, '나가기', 0x222222, 0x666666, () => {
      this.emitCompletedReward();
      returnToScene(this, this.returnSceneKey);
    });
  }

  createBtn(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => cb());
  }

  shutdown() {
    this.input.off('pointerdown');

    if (this.keys) {
      this.input.keyboard.removeKey('W');
      this.input.keyboard.removeKey('A');
      this.input.keyboard.removeKey('S');
      this.input.keyboard.removeKey('D');
    }

    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
  }

  emitCompletedReward() {
    if (!this.completedRewardText || this.rewardEmitted) return;
    emitMinigameReward(this, { sceneKey: 'TankScene', rewardText: this.completedRewardText });
    this.rewardEmitted = true;
  }
}
