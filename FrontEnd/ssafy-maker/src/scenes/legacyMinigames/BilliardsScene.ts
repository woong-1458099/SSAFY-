// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

export default class BilliardsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BilliardsScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    const W = 800;
    const H = 600;
    this.gameOver = false;
    this.score = 0;
    this.targetBallsCount = 0;

    // Background (Table)
    this.add.rectangle(W / 2, H / 2, W, H, 0x004411);
    
    // Borders
    const borderThickness = 30;
    this.add.rectangle(W / 2, borderThickness / 2, W, borderThickness, 0x221100); // Top
    this.add.rectangle(W / 2, H - borderThickness / 2, W, borderThickness, 0x221100); // Bottom
    this.add.rectangle(borderThickness / 2, H / 2, borderThickness, H, 0x221100); // Left
    this.add.rectangle(W - borderThickness / 2, H / 2, borderThickness, H, 0x221100); // Right

    // Pockets
    this.pockets = this.physics.add.staticGroup();
    const pocketRadius = 35;
    const offset = borderThickness + 5;
    const pocketPositions = [
      { x: offset, y: offset }, { x: W / 2, y: borderThickness }, { x: W - offset, y: offset },
      { x: offset, y: H - offset }, { x: W / 2, y: H - borderThickness }, { x: W - offset, y: H - offset }
    ];

    pocketPositions.forEach(pos => {
      const pocket = this.add.circle(pos.x, pos.y, pocketRadius, 0x000000);
      this.pockets.add(pocket);
    });

    // UI
    this.add.rectangle(W / 2, 25, W, 50, 0x002200, 0.8);
    this.add.text(W / 2, 15, 'BILLIARDS CHALLENGE', { fontSize: '18px', color: '#00ff44', fontFamily: PF }).setOrigin(0.5);
    this.scoreTxt = this.add.text(20, 20, 'BALLS: 0', { fontSize: '12px', color: '#ffffff', fontFamily: PF });

    // Physics Settings
    this.physics.world.setBounds(borderThickness, borderThickness, W - 2 * borderThickness, H - 2 * borderThickness);
    
    // Balls Group
    this.balls = this.physics.add.group({
      bounceX: 1,
      bounceY: 1,
      dragX: 60,
      dragY: 60,
      collideWorldBounds: true
    });

    // Target Balls
    const ballColors = [0xff0000, 0xffff00, 0x0000ff, 0xff8800, 0x8800ff, 0x00ffff, 0xff00ff, 0x333333];
    const startX = 550;
    const startY = H / 2;
    const spacing = 24;
    
    let ballIdx = 0;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j <= i; j++) {
            const bx = startX + i * spacing * 0.85;
            const by = startY - (i * spacing / 2) + j * spacing;
            this.createBall(bx, by, ballColors[ballIdx % ballColors.length]);
            ballIdx++;
            this.targetBallsCount++;
        }
    }

    // Cue Ball
    this.cueBall = this.physics.add.sprite(200, H / 2, null);
    this.cueBall.setCircle(10);
    this.cueBall.setDisplaySize(20, 20);
    this.cueBall.setTint(0xffffff);
    this.cueBall.setBounce(1);
    this.cueBall.setDrag(60);
    this.cueBall.setCollideWorldBounds(true);
    this.balls.add(this.cueBall);

    // Collisions
    this.physics.add.collider(this.balls, this.balls);

    // Interaction
    this.isDragging = false;
    this.line = this.add.graphics();
    
    this.input.on('pointerdown', (pointer) => {
        if (this.gameOver) return;
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
        if (dist < 30 && this.cueBall.body.velocity.length() < 5) {
            this.isDragging = true;
        }
    });

    this.input.on('pointermove', (pointer) => {
        if (this.isDragging) {
            this.line.clear();
            this.line.lineStyle(2, 0xffffff, 0.5);
            this.line.lineBetween(this.cueBall.x, this.cueBall.y, pointer.x, pointer.y);
            
            // Prediction line (opposite side)
            const angle = Phaser.Math.Angle.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
            this.line.lineStyle(1, 0xffffff, 0.2);
            this.line.lineBetween(this.cueBall.x, this.cueBall.y, this.cueBall.x + Math.cos(angle) * 100, this.cueBall.y + Math.sin(angle) * 100);
        }
    });

    this.input.on('pointerup', (pointer) => {
        if (this.isDragging) {
            this.isDragging = false;
            this.line.clear();
            
            const angle = Phaser.Math.Angle.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
            const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.cueBall.x, this.cueBall.y);
            const power = Math.min(dist * 3, 800);
            
            this.physics.velocityFromRotation(angle, power, this.cueBall.body.velocity);
        }
    });
  }

  createBall(x, y, color) {
    const ball = this.physics.add.sprite(x, y, null);
    ball.setCircle(10);
    ball.setDisplaySize(20, 20);
    ball.setTint(color);
    ball.setBounce(1);
    ball.setDrag(60);
    ball.setCollideWorldBounds(true);
    this.balls.add(ball);
    return ball;
  }

  update() {
    if (this.gameOver) return;

    // Check pockets
    this.balls.children.iterate((ball) => {
        if (!ball) return;
        
        pocketPositions.forEach(pos => {
            const dist = Phaser.Math.Distance.Between(ball.x, ball.y, pos.x, pos.y);
            if (dist < 25) {
                if (ball === this.cueBall) {
                    this.resetCueBall();
                } else {
                    ball.destroy();
                    this.score++;
                    this.scoreTxt.setText(`BALLS: ${this.score}`);
                    if (this.score >= this.targetBallsCount) {
                        this.triggerWin();
                    }
                }
            }
        });

        // Friction handling (stop if very slow)
        if (ball.body && ball.body.velocity.length() < 5) {
            ball.body.setVelocity(0, 0);
        }
    });
  }

  resetCueBall() {
    this.cueBall.setPosition(200, 300);
    this.cueBall.body.setVelocity(0, 0);
    this.cameras.main.shake(100, 0.005);
  }

  triggerWin() {
    this.gameOver = true;
    this.time.delayedCall(1000, () => this.endGame());
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x002200);
    
    this.add.text(W / 2, H / 2 - 50, 'CHALLENGE CLEAR!', { fontSize: '32px', color: '#00ff44', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 20, 'REWARD: AGI +10, GP +30', { fontSize: '16px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    
    this.createBtn(400, 450, 'BACK TO MENU', 0x004411, 0x00ff44, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 240, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => cb());
  }
}

// Helper for pockets (not using physics group perfectly here, just raw dist check in update)
const pocketPositions = [
    { x: 35, y: 35 }, { x: 400, y: 30 }, { x: 765, y: 35 },
    { x: 35, y: 565 }, { x: 400, y: 570 }, { x: 765, y: 565 }
];
