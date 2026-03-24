// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';
import { emitMinigameReward } from '@features/minigame/minigameRewardEvents';
import { LEGACY_RUNNER_SCENE_KEY } from '@features/minigame/minigameSceneKeys';
import {
  LEGACY_RUNNER_COUNTDOWN_DELAY_MS,
  LEGACY_RUNNER_INITIAL_OBSTACLE_DELAY_MS,
  LEGACY_RUNNER_INITIAL_SPEED,
  LEGACY_RUNNER_MIN_OBSTACLE_DELAY_MS,
  resolveLegacyRunnerResult
} from '@features/minigame/legacy/legacyRunnerConfig';
import { SCREEN, PIXEL_FONT, COLORS, createBackground, createPanel, createButton } from './utils';
import { showMinigameTutorial } from './utils/minigameTutorial';
import { getMinigameCard } from '@features/minigame/minigameCatalog';

const { W, H } = SCREEN;

// Runner 에셋 경로
const RUNNER_ASSETS = {
  background: '/assets/game/minigame/runner/back_city.png',
  player: '/assets/game/minigame/runner/BunnyRun.png',
  obstacles: '/assets/game/minigame/runner/obstacles.png'
};

export default class RunnerScene extends Phaser.Scene {
  private returnSceneKey = 'main';
  private completedRewardText = null;
  private rewardEmitted = false;
  private tutorialContainer = null;

  constructor() { super({ key: LEGACY_RUNNER_SCENE_KEY }); }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'main';
  }

  preload() {
    this.load.image('runner_bg', RUNNER_ASSETS.background);
    this.load.spritesheet('runner_player', RUNNER_ASSETS.player, {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet('runner_obstacles', RUNNER_ASSETS.obstacles, {
      frameWidth: 48,
      frameHeight: 48
    });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    // 튜토리얼 표시
    const catalogData = getMinigameCard(this.scene.key);
    if (catalogData?.howToPlay) {
      this.tutorialContainer = showMinigameTutorial(this, {
        title: catalogData.title,
        howToPlay: catalogData.howToPlay,
        reward: catalogData.reward,
        onStart: () => {
          this.tutorialContainer?.destroy();
          this.tutorialContainer = null;
          this.startGame();
        },
        onBack: () => {
          returnToScene(this, this.returnSceneKey);
        }
      });
    } else {
      this.startGame();
    }
  }

  startGame() {
    const W = 800, H = 600;
    this.completedRewardText = null;
    this.rewardEmitted = false;
    this.score = 0; this.gameOver = false; this.speed = LEGACY_RUNNER_INITIAL_SPEED; this.jumpCount = 0; this.obstacles = []; this.grounds = [];

    // 배경: 스크롤링 배경 (좌우반전으로 무한루프)
    this.backgrounds = [];
    const bgTexture = this.textures.get('runner_bg');
    const bgWidth = bgTexture.getSourceImage().width;
    const bgHeight = bgTexture.getSourceImage().height;
    const scaleY = H / bgHeight;
    const scaledWidth = Math.floor(bgWidth * scaleY); // 정수로 내림하여 틈 방지

    for (let i = 0; i < 3; i++) {
      const bg = this.add.image(i * scaledWidth, H / 2, 'runner_bg')
        .setOrigin(0, 0.5)
        .setScale(scaleY)
        .setDepth(0);
      // 짝수 인덱스는 정방향, 홀수는 좌우반전
      if (i % 2 === 1) bg.setFlipX(true);
      this.backgrounds.push({ obj: bg, width: scaledWidth });
    }

    // UI 헤더
    this.add.rectangle(W / 2, 25, W, 50, 0x0d1545, 0.95).setDepth(10);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700).setDepth(10);
    this.add.rectangle(W / 2, 50, W, 3, 0x4488ff).setDepth(10);
    this.add.text(W / 2, 10, 'BUNNY RUNNER', { fontSize: '14px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5, 0).setDepth(10);
    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', { fontSize: '9px', color: '#ffffff', fontFamily: PIXEL_FONT }).setDepth(10);
    this.hiTxt = this.add.text(W - 20, 12, 'BEST: 0', { fontSize: '9px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(1, 0).setDepth(10);

    // 바닥
    this.groundY = 480;
    this.add.rectangle(W / 2, this.groundY + 20, W, 3, 0x4488ff, 0.5).setDepth(2);
    for (let i = 0; i < 26; i += 1) this.grounds.push(this.add.rectangle(i * 32, this.groundY + 30, 28, 8, 0x223366).setOrigin(0, 0.5).setDepth(2));

    // 플레이어: BunnyRun 애니메이션 스프라이트
    this.playerX = 120; this.playerY = this.groundY - 30; this.playerVY = 0; this.isGround = true;

    // 달리기 애니메이션 생성
    const totalPlayerFrames = this.textures.get('runner_player').frameTotal - 1;
    if (!this.anims.exists('bunny_run')) {
      this.anims.create({
        key: 'bunny_run',
        frames: this.anims.generateFrameNumbers('runner_player', { start: 0, end: Math.max(0, totalPlayerFrames - 1) }),
        frameRate: 10,
        repeat: -1
      });
    }

    this.player = this.add.sprite(this.playerX, this.playerY, 'runner_player')
      .setDepth(5)
      .setScale(2); // 토끼 2배 크기
    this.player.play('bunny_run');

    this.hintTxt = this.add.text(W / 2, 540, 'SPACE / CLICK = JUMP', { fontSize: '9px', color: '#445577', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(10);
    this.showCountdown();
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    this.input.on('pointerdown', this.jump, this);

    // 씬 종료 시 정리
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  shutdown() {
    this.input.keyboard.off('keydown-SPACE', this.jump, this);
    this.input.off('pointerdown', this.jump, this);
    if (this.obstacleEvent) this.obstacleEvent.remove();
    this.obstacles = [];
  }

  showCountdown() {
    const W = 800; let count = 3;
    const countTxt = this.add.text(W / 2, 280, '3', { fontSize: '60px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.time.addEvent({
      delay: LEGACY_RUNNER_COUNTDOWN_DELAY_MS, repeat: 2,
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

  getSpawnDelay() { return Math.max(LEGACY_RUNNER_MIN_OBSTACLE_DELAY_MS, LEGACY_RUNNER_INITIAL_OBSTACLE_DELAY_MS - this.score * 2); }
  scheduleObstacle() { if (!this.gameOver) { this.spawnObstacle(); this.obstacleEvent = this.time.addEvent({ delay: this.getSpawnDelay(), loop: false, callback: this.scheduleObstacle, callbackScope: this }); } }

  spawnObstacle() {
    if (this.gameOver) return;
    const W = 800;
    // 스프라이트시트에서 랜덤 프레임 선택
    const totalFrames = this.textures.get('runner_obstacles').frameTotal - 1;
    const randomFrame = Phaser.Math.Between(0, Math.max(0, totalFrames - 1));

    // 25% 확률로 1.5배 크기의 큰 장애물 생성 (이단점프 필요)
    const isLarge = Phaser.Math.Between(1, 100) <= 25;
    const scale = isLarge ? 1.5 : 1;

    const obstacle = this.add.image(W + 48, this.groundY, 'runner_obstacles', randomFrame)
      .setDepth(4)
      .setOrigin(0.5, 1)
      .setScale(scale);
    obstacle.obstacleHeight = 48 * scale;
    obstacle.isLarge = isLarge;
    this.obstacles.push(obstacle);
  }

  jump() {
    if (!this.started || this.gameOver) return;
    if (this.isGround) { this.playerVY = -420; this.isGround = false; this.jumpCount = 1; this.cameras.main.shake(80, 0.002); }
    else if (this.jumpCount < 2) {
      this.playerVY = -450; this.jumpCount += 1;
      const effect = this.add.text(this.playerX, this.playerY - 20, '2x JUMP!', { fontSize: '8px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5).setDepth(10);
      this.tweens.add({ targets: effect, y: this.playerY - 60, alpha: 0, duration: 500, onComplete: () => effect.destroy() });
    }
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;
    const dt = delta / 1000;
    this.score += delta * 0.05;
    this.scoreTxt.setText(`SCORE: ${Math.floor(this.score)}`);
    this.speed = 300 + this.score * 0.3;

    // 배경 스크롤 (무한루프) - 정수로 반올림하여 틈 방지
    this.backgrounds.forEach((bg) => {
      bg.obj.x -= this.speed * 0.3 * dt;
      // 화면 왼쪽으로 완전히 벗어나면 오른쪽 끝으로 이동
      if (bg.obj.x + bg.width < 0) {
        bg.obj.x = Math.round(bg.obj.x + bg.width * this.backgrounds.length);
        bg.obj.setFlipX(!bg.obj.flipX); // 좌우반전 토글
      }
    });

    // 바닥 스크롤
    this.grounds.forEach((g) => { g.x -= this.speed * dt; if (g.x < -32) g.x += 26 * 32; });

    // 플레이어 물리
    this.playerVY += 1400 * dt; this.playerY += this.playerVY * dt;
    if (this.playerY >= this.groundY - 30) { this.playerY = this.groundY - 30; this.playerVY = 0; this.isGround = true; this.jumpCount = 0; }
    this.player.setY(this.playerY);

    // 장애물 이동 및 충돌 체크
    this.obstacles.forEach((obs, idx) => {
      obs.x -= this.speed * dt;
      const obsHeight = obs.obstacleHeight || 48;
      const obsScale = obs.isLarge ? 1.5 : 1;
      const hitboxWidth = 28 * obsScale;
      if (Math.abs(this.playerX - obs.x) < hitboxWidth && Math.abs(this.playerY - obs.y) < 20 + obsHeight / 2) {
        this.triggerGameOver();
        return;
      }
      if (obs.x < -60 * obsScale) { obs.destroy(); this.obstacles.splice(idx, 1); }
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
    this.add.text(W / 2, 130, 'BUNNY RUNNER', { fontSize: '16px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 165, 'GAME OVER', { fontSize: '12px', color: '#ff4466', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 230, `${finalScore}`, { fontSize: '36px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 275, 'SCORE', { fontSize: '9px', color: '#888888', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    const result = resolveLegacyRunnerResult(finalScore);
    this.completedRewardText = result.reward;
    this.add.text(W / 2 + 160, 240, result.grade, { fontSize: '60px', color: result.gradeColor, fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 340, result.reward, { fontSize: '10px', color: '#aaddff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 375, 'TIP: DOUBLE JUMP IS AVAILABLE!', { fontSize: '7px', color: '#445566', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.createBtn(270, 440, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 440, 'EXIT', 0x440088, 0xcc55ff, () => {
      this.emitCompletedReward();
      returnToScene(this, this.returnSceneKey);
    });
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.cameras.main.flash(150, 255, 255, 255, false); this.time.delayedCall(150, cb); });
  }

  emitCompletedReward() {
    if (!this.completedRewardText || this.rewardEmitted) return;
    emitMinigameReward(this, { sceneKey: this.scene.key, rewardText: this.completedRewardText });
    this.rewardEmitted = true;
  }
}
