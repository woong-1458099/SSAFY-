// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

export default class TankScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TankScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    const W = 800;
    const H = 600;
    this.gameOver = false;
    this.score = 0;
    this.spawnTimer = 0;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a1a);
    
    // UI
    this.add.rectangle(W / 2, 25, W, 50, 0x333333, 0.8);
    this.add.text(W / 2, 15, 'TANK WAR', { fontSize: '18px', color: '#88ff00', fontFamily: PF }).setOrigin(0.5);
    this.scoreTxt = this.add.text(20, 20, 'SCORE: 0', { fontSize: '12px', color: '#ffffff', fontFamily: PF });

    // Player Tank
    this.player = this.add.container(W / 2, H / 2);
    const body = this.add.rectangle(0, 0, 40, 50, 0x334400).setStrokeStyle(2, 0x88ff00);
    const turret = this.add.rectangle(0, -10, 10, 30, 0x556622).setOrigin(0.5, 1).setStrokeStyle(1, 0x88ff00);
    this.player.add([body, turret]);
    this.player.turret = turret;
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setCircle(20, -20, -25);

    // Groups
    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');

    // Input events
    this.input.on('pointerdown', () => {
        if (!this.gameOver) this.fireBullet();
    });

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

    this.showCountdown();
  }

  showCountdown() {
      const W = 800;
      let count = 3;
      const countTxt = this.add.text(W / 2, 300, '3', { fontSize: '60px', color: '#88ff00', fontFamily: PF }).setOrigin(0.5);
      
      this.time.addEvent({
          delay: 1000,
          repeat: 2,
          callback: () => {
              count--;
              if (count > 0) {
                  countTxt.setText(count.toString());
              } else {
                  countTxt.setText('FIGHT!');
                  this.time.delayedCall(500, () => {
                      countTxt.destroy();
                      this.started = true;
                  });
              }
          }
      });
  }

  fireBullet() {
      if (!this.started || this.gameOver) return;

      const angle = this.player.turret.rotation - Math.PI / 2;
      const bx = this.player.x + Math.cos(angle) * 30;
      const by = this.player.y + Math.sin(angle) * 30;

      const bullet = this.bullets.create(bx, by, null);
      this.add.rectangle(0, 0, 4, 10, 0xffff00).setParentContainer(bullet);
      
      bullet.setRotation(angle + Math.PI / 2);
      this.physics.velocityFromRotation(angle, 400, bullet.body.velocity);
      
      // Cleanup bullet
      this.time.delayedCall(2000, () => {
          if (bullet.active) bullet.destroy();
      });
  }

  spawnEnemy() {
      if (this.gameOver) return;

      const side = Phaser.Math.Between(0, 3);
      let x, y;
      const W = 800, H = 600;

      if (side === 0) { x = Phaser.Math.Between(0, W); y = -50; }
      else if (side === 1) { x = W + 50; y = Phaser.Math.Between(0, H); }
      else if (side === 2) { x = Phaser.Math.Between(0, W); y = H + 50; }
      else { x = -50; y = Phaser.Math.Between(0, H); }

      const enemy = this.enemies.create(x, y, null);
      const ebody = this.add.rectangle(0, 0, 30, 30, 0x441100).setStrokeStyle(2, 0xff4400).setRotation(Math.random() * Math.PI);
      enemy.add(ebody);
      enemy.hp = 1;

      // Move toward player
      this.physics.moveToObject(enemy, this.player, 100 + Math.min(this.score * 2, 200));
  }

  hitEnemy(bullet, enemy) {
      bullet.destroy();
      enemy.destroy();
      this.score += 10;
      this.scoreTxt.setText(`SCORE: ${this.score}`);
      this.cameras.main.shake(100, 0.002);
  }

  hitPlayer(player, enemy) {
      if (this.gameOver) return;
      this.triggerGameOver();
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;

    // Turret rotation follows mouse
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.input.activePointer.x, this.input.activePointer.y);
    this.player.turret.rotation = angle + Math.PI / 2;

    // Movement
    let vx = 0, vy = 0;
    const speed = 200;

    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -speed;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = speed;

    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -speed;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = speed;

    this.player.body.setVelocity(vx, vy);

    // Enemy Spawning
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = Math.max(500, 2000 - this.score * 10);
    }
  }

  triggerGameOver() {
      this.gameOver = true;
      this.player.body.setVelocity(0, 0);
      this.cameras.main.flash(300, 255, 0, 0);
      this.cameras.main.shake(500, 0.01);
      
      this.time.delayedCall(1000, () => this.endGame());
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a1a);
    
    this.add.text(W / 2, H / 2 - 50, 'GAME OVER', { fontSize: '48px', color: '#ff4400', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 20, `FINAL SCORE: ${this.score}`, { fontSize: '20px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 60, 'REWARD: INT +10, GP +40', { fontSize: '14px', color: '#88ff00', fontFamily: PF }).setOrigin(0.5);
    
    this.createBtn(400, 480, 'RETRY', 0x332200, 0x88ff00, () => this.scene.restart());
    this.createBtn(400, 540, 'MENU', 0x222222, 0x666666, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 200, 45, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => cb());
  }

  shutdown() {
    this.input.off('pointerdown');
  }
}
