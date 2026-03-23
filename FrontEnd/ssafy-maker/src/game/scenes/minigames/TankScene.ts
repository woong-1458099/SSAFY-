// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';
import { emitMinigameReward } from '@features/minigame/minigameRewardEvents';
import { LEGACY_TANK_SCENE_KEY } from '@features/minigame/minigameSceneKeys';
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
    super({ key: LEGACY_TANK_SCENE_KEY });
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

    // UI - Enemy lives (top right)
    this.add.text(W - 170, 15, 'ENEMY', { fontSize: '10px', color: '#ff4466', fontFamily: PIXEL_FONT });
    this.enemyLivesIcons = [];
    for (let i = 0; i < LEGACY_TANK_INITIAL_LIVES; i++) {
      const heart = this.add.text(W - 100 + i * 25, 12, '❤️', { fontSize: '14px' });
      this.enemyLivesIcons.push(heart);
    }

    // Title
    this.add.text(W / 2, 15, '🎮 탱크 배틀', { fontSize: '16px', color: '#88ff00', fontFamily: PIXEL_FONT }).setOrigin(0.5);

    // Hint
    this.hintTxt = this.add.text(W / 2, H - 18, 'WASD: 이동 | 방향키: 조준 | SPACE: 발사', { fontSize: '10px', color: '#88ff88', fontFamily: PIXEL_FONT }).setOrigin(0.5);

    // Create Player Tank (bottom - Blue/Green)
    this.player = this.createTank(W / 2, H - 100, 0x334400, 0x88ff00, true);

    // Create Enemy Tank (top - Red)
    this.enemy = this.createTank(W / 2, 100, 0x440000, 0xff4466, false);
    this.enemyTargetX = this.enemy.x;
    this.enemyTargetY = this.enemy.y;
    this.enemyMoveTimer = 0;

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

    // Space fire
    this.input.keyboard.on('keydown-SPACE', () => {
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

  enemyFire() {
    const now = this.time.now;
    if (now - this.lastEnemyShot < this.shootCooldown * 1.8) return;
    this.lastEnemyShot = now;

    // Enemy aims at player
    const aimAngle = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
    this.fireBullet(this.enemy.x, this.enemy.y, aimAngle, false);
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
    if (!this.enemy || this.gameOver) return;

    // Move AI randomly in top half
    this.enemyMoveTimer -= dt * 1000;
    if (this.enemyMoveTimer <= 0) {
      this.enemyTargetX = Phaser.Math.Between(80, W - 80);
      this.enemyTargetY = Phaser.Math.Between(80, H / 2 - 60);
      this.enemyMoveTimer = Phaser.Math.Between(1000, 2500);
    }

    // Move toward target
    const dx = this.enemyTargetX - this.enemy.x;
    const dy = this.enemyTargetY - this.enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      const speed = 100;
      this.enemy.x += (dx / dist) * speed * dt;
      this.enemy.y += (dy / dist) * speed * dt;
    }

    // Clamp position (top half)
    this.enemy.x = Phaser.Math.Clamp(this.enemy.x, 50, W - 50);
    this.enemy.y = Phaser.Math.Clamp(this.enemy.y, 50, H / 2 - 40);

    // Aim turret at player
    const turret = this.enemy.getData('turret');
    const aimAngle = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
    turret.rotation = aimAngle + Math.PI / 2;

    // Fire at player periodically
    if (Phaser.Math.Between(0, 100) < 3) {
      this.enemyFire();
    }
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;

    const dt = delta / 1000;
    const speed = 160;

    // Player turret aiming with arrow keys
    if (this.cursors.up.isDown) {
      this.playerAimAngle = -Math.PI / 2; // 위
    } else if (this.cursors.down.isDown) {
      this.playerAimAngle = Math.PI / 2; // 아래
    } else if (this.cursors.left.isDown) {
      this.playerAimAngle = Math.PI; // 왼쪽
    } else if (this.cursors.right.isDown) {
      this.playerAimAngle = 0; // 오른쪽
    }

    // Diagonal aiming
    if (this.cursors.up.isDown && this.cursors.left.isDown) {
      this.playerAimAngle = -Math.PI * 3 / 4;
    } else if (this.cursors.up.isDown && this.cursors.right.isDown) {
      this.playerAimAngle = -Math.PI / 4;
    } else if (this.cursors.down.isDown && this.cursors.left.isDown) {
      this.playerAimAngle = Math.PI * 3 / 4;
    } else if (this.cursors.down.isDown && this.cursors.right.isDown) {
      this.playerAimAngle = Math.PI / 4;
    }

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

    // Update player bullets
    this.updateBullets(this.playerBullets, this.enemy, false, dt);

    // Update enemy bullets
    this.updateBullets(this.enemyBullets, this.player, true, dt);
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
    } else {
      this.enemyLives--;
      if (this.enemyLives >= 0 && this.enemyLivesIcons[this.enemyLives]) {
        this.enemyLivesIcons[this.enemyLives].setText('🖤');
      }
      // Reset enemy position
      this.enemy.x = W / 2;
      this.enemy.y = 100;
      this.enemyTargetX = this.enemy.x;
      this.enemyTargetY = this.enemy.y;
    }

    // Check game over
    if (this.playerLives <= 0) {
      this.triggerGameOver(false);
    } else if (this.enemyLives <= 0) {
      this.triggerGameOver(true);
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
    this.input.keyboard.off('keydown-SPACE');

    if (this.keys) {
      this.input.keyboard.removeKey('W');
      this.input.keyboard.removeKey('A');
      this.input.keyboard.removeKey('S');
      this.input.keyboard.removeKey('D');
      this.input.keyboard.removeKey('SPACE');
    }
    if (this.cursors) {
      this.cursors.up.destroy();
      this.cursors.down.destroy();
      this.cursors.left.destroy();
      this.cursors.right.destroy();
    }

    this.playerBullets = [];
    this.enemyBullets = [];
  }

  emitCompletedReward() {
    if (!this.completedRewardText || this.rewardEmitted) return;
    emitMinigameReward(this, { sceneKey: this.scene.key, rewardText: this.completedRewardText });
    this.rewardEmitted = true;
  }
}
