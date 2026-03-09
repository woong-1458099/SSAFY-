import Phaser from 'phaser';

const PF = '"Press Start 2P"';

export default class RunnerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunnerScene' });
  }

  create() {
    const W = 800, H = 600;

    this.score = 0;
    this.gameOver = false;
    this.speed = 300;
    this.jumpCount = 0;
    this.obstacles = [];
    this.grounds = [];

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 별
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, 300),
        Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3),
        0xffffff, Phaser.Math.FloatBetween(0.2, 0.6)
      );
      this.stars.push({ obj: star, speed: Phaser.Math.FloatBetween(0.3, 1) });
    }

    // 상단 HUD
    this.add.rectangle(W/2, 25, W, 50, 0x0d1545, 0.95);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W/2, 50, W, 3, 0x4488ff);

    this.add.text(W/2, 10, 'BUS RUNNER', {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    });

    this.hiTxt = this.add.text(W - 20, 12, 'BEST: 0', {
      fontSize: '9px', color: '#FFD700', fontFamily: PF
    }).setOrigin(1, 0);

    // 바닥
    this.groundY = 480;
    this.add.rectangle(W/2, this.groundY + 20, W, 3, 0x4488ff, 0.5);

    // 바닥 타일 (스크롤)
    for (let i = 0; i < 26; i++) {
      const tile = this.add.rectangle(
        i * 32, this.groundY + 30, 28, 8, 0x223366
      ).setOrigin(0, 0.5);
      this.grounds.push(tile);
    }

    // 배경 건물들
    this.buildings = [];
    for (let i = 0; i < 6; i++) {
      const bh = Phaser.Math.Between(60, 150);
      const bw = Phaser.Math.Between(40, 80);
      const bx = i * 150 + Phaser.Math.Between(0, 50);
      const building = this.add.rectangle(
        bx, this.groundY - bh/2, bw, bh, 0x112244
      ).setStrokeStyle(1, 0x223366);
      // 창문
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          const lit = Math.random() > 0.4;
          this.add.rectangle(
            bx - 10 + c * 20,
            this.groundY - bh + 20 + r * 30,
            10, 12,
            lit ? 0xffdd88 : 0x112244
          );
        }
      }
      this.buildings.push({ obj: building, speed: 0.4 });
    }

    // 플레이어 (픽셀 캐릭터)
    this.playerX = 120;
    this.playerY = this.groundY - 30;
    this.playerVY = 0;
    this.isGround = true;

    // 플레이어 그래픽
    this.player = this.add.container(this.playerX, this.playerY);

    const body = this.add.rectangle(0, 0, 36, 44, 0x4499ff)
      .setStrokeStyle(3, 0x88ccff);
    const head = this.add.rectangle(0, -34, 28, 24, 0xffcc88)
      .setStrokeStyle(2, 0xdd9944);
    const eye = this.add.rectangle(6, -36, 6, 6, 0x000000);
    const mouth = this.add.rectangle(4, -26, 10, 4, 0xcc4444);
    // SSAFY 조끼
    const vest = this.add.rectangle(0, 2, 36, 30, 0x002266)
      .setStrokeStyle(2, 0x4499ff);
    const badge = this.add.rectangle(-8, -4, 12, 8, 0xFFD700);
    const badgeTxt = this.add.text(-8, -4, 'S', {
      fontSize: '6px', color: '#000000', fontFamily: PF
    }).setOrigin(0.5);

    this.player.add([body, vest, head, eye, mouth, badge, badgeTxt]);
    this.player.setDepth(5);

    // 달리기 애니메이션 (다리)
    this.legAnim = 0;
    this.legL = this.add.rectangle(this.playerX - 8, this.playerY + 28, 10, 20, 0x4499ff);
    this.legR = this.add.rectangle(this.playerX + 8, this.playerY + 28, 10, 20, 0x4499ff);

    // 점프 안내
    this.hintTxt = this.add.text(W/2, 540, 'SPACE / CLICK = JUMP', {
      fontSize: '9px', color: '#445577', fontFamily: PF
    }).setOrigin(0.5);

    // 카운트다운
    this.showCountdown();

    // 점프 입력
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    this.input.on('pointerdown', this.jump, this);
  }

  showCountdown() {
    const W = 800;
    let count = 3;

    const countTxt = this.add.text(W/2, 280, '3', {
      fontSize: '60px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 700, repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countTxt.setText(String(count));
          this.tweens.add({
            targets: countTxt, scaleX: 1.3, scaleY: 1.3,
            duration: 100, yoyo: true
          });
        } else {
          countTxt.setText('RUN!').setColor('#00ff88');
          this.tweens.add({
            targets: countTxt, alpha: 0, duration: 400,
            onComplete: () => {
              countTxt.destroy();
              this.hintTxt.setVisible(false);
              this.started = true;
              // 장애물 스폰 시작
              this.spawnObstacle();
              this.obstacleEvent = this.time.addEvent({
                delay: this.getSpawnDelay(),
                loop: false,
                callback: this.scheduleObstacle,
                callbackScope: this
              });
            }
          });
        }
      }
    });
  }

  getSpawnDelay() {
    return Math.max(1200, 2200 - this.score * 2);
  }

  scheduleObstacle() {
    if (this.gameOver) return;
    this.spawnObstacle();
    this.obstacleEvent = this.time.addEvent({
      delay: this.getSpawnDelay(),
      loop: false,
      callback: this.scheduleObstacle,
      callbackScope: this
    });
  }

  spawnObstacle() {
    if (this.gameOver) return;
    const W = 800;

    const type = Phaser.Math.Between(0, 2);
    let obstacle;

    if (type === 0) {
      // 낮은 장애물 (점프)
      obstacle = this.add.container(W + 30, this.groundY - 20);
      const body = this.add.rectangle(0, 0, 28, 40, 0xff4466)
        .setStrokeStyle(3, 0xff88aa);
      const top = this.add.rectangle(0, -24, 36, 12, 0xff2244)
        .setStrokeStyle(2, 0xff88aa);
      const eye = this.add.rectangle(6, -4, 6, 6, 0xffff00);
      obstacle.add([body, top, eye]);
      obstacle.height = 40;
      obstacle.type = 'low';

    } else if (type === 1) {
      // 높은 장애물 (더 높이 점프)
      obstacle = this.add.container(W + 30, this.groundY - 40);
      const body = this.add.rectangle(0, 0, 24, 80, 0xffaa00)
        .setStrokeStyle(3, 0xffdd44);
      const top = this.add.rectangle(0, -44, 32, 14, 0xff8800)
        .setStrokeStyle(2, 0xffdd44);
      obstacle.add([body, top]);
      obstacle.height = 80;
      obstacle.type = 'high';

    } else {
      // 날아오는 장애물 (낮게 피하기 - 더블점프 금지)
      obstacle = this.add.container(W + 30, this.groundY - 120);
      const body = this.add.rectangle(0, 0, 44, 24, 0x44ff88)
        .setStrokeStyle(3, 0x88ffaa);
      const wing1 = this.add.rectangle(-20, -10, 20, 10, 0x22cc66);
      const wing2 = this.add.rectangle(20, -10, 20, 10, 0x22cc66);
      obstacle.add([body, wing1, wing2]);
      obstacle.height = 24;
      obstacle.type = 'fly';
    }

    obstacle.setDepth(4);
    this.obstacles.push(obstacle);
  }

  jump() {
    if (!this.started || this.gameOver) return;

    if (this.isGround) {
      this.playerVY = -520;
      this.isGround = false;
      this.jumpCount = 1;
      this.cameras.main.shake(80, 0.002);
    } else if (this.jumpCount < 2) {
      // 더블 점프
      this.playerVY = -420;
      this.jumpCount++;

      // 더블점프 이펙트
      const effect = this.add.text(this.playerX, this.playerY - 20, '2x JUMP!', {
        fontSize: '8px', color: '#FFD700', fontFamily: PF
      }).setOrigin(0.5).setDepth(10);
      this.tweens.add({
        targets: effect, y: this.playerY - 60, alpha: 0,
        duration: 500, onComplete: () => effect.destroy()
      });
    }
  }

  update(time, delta) {
    if (!this.started || this.gameOver) return;

    const dt = delta / 1000;

    // 점수 증가
    this.score += delta * 0.05;
    this.scoreTxt.setText(`SCORE: ${Math.floor(this.score)}`);

    // 속도 증가
    this.speed = 300 + this.score * 0.3;

    // 별 스크롤
    this.stars.forEach(s => {
      s.obj.x -= s.speed;
      if (s.obj.x < 0) s.obj.x = 800;
    });

    // 바닥 타일 스크롤
    this.grounds.forEach(g => {
      g.x -= this.speed * dt;
      if (g.x < -32) g.x += 26 * 32;
    });

    // 건물 스크롤
    this.buildings.forEach(b => {
      b.obj.x -= this.speed * 0.3 * dt;
      if (b.obj.x < -100) b.obj.x = 900;
    });

    // 플레이어 물리
    this.playerVY += 1400 * dt;
    this.playerY += this.playerVY * dt;

    if (this.playerY >= this.groundY - 30) {
      this.playerY = this.groundY - 30;
      this.playerVY = 0;
      this.isGround = true;
      this.jumpCount = 0;
    }

    this.player.setY(this.playerY);
    this.legL.setY(this.playerY + 28);
    this.legR.setY(this.playerY + 28);

    // 달리기 애니메이션
    if (this.isGround) {
      this.legAnim += delta * 0.01;
      this.legL.setY(this.playerY + 28 + Math.sin(this.legAnim) * 6);
      this.legR.setY(this.playerY + 28 + Math.sin(this.legAnim + Math.PI) * 6);
    }

    // 장애물 이동 & 충돌 체크
    this.obstacles.forEach((obs, idx) => {
      obs.x -= this.speed * dt;

      // 충돌 체크 (간단한 AABB)
      const px = this.playerX;
      const py = this.playerY;
      const ox = obs.x;
      const oy = obs.y;

      const pW = 18, pH = 22;
      const oW = 14, oH = obs.height / 2;

      if (
        Math.abs(px - ox) < pW + oW &&
        Math.abs(py - oy) < pH + oH
      ) {
        this.triggerGameOver();
        return;
      }

      // 화면 밖으로 나가면 제거
      if (obs.x < -60) {
        obs.destroy();
        this.obstacles.splice(idx, 1);
      }
    });
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;

    if (this.obstacleEvent) this.obstacleEvent.remove();

    // 플레이어 빨간색으로
    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(300, 255, 0, 0, false);

    this.time.delayedCall(800, () => this.endGame());
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600;

    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);

    this.add.rectangle(W/2 + 3, H/2 + 3, 620, 380, 0x000000, 0.8);
    this.add.rectangle(W/2, H/2, 620, 380, 0x0d1545);
    this.add.rectangle(W/2, H/2 - 188, 620, 4, 0xFFD700);
    this.add.rectangle(W/2, H/2 + 188, 620, 4, 0xFFD700);
    this.add.rectangle(W/2 - 308, H/2, 4, 380, 0xFFD700);
    this.add.rectangle(W/2 + 308, H/2, 4, 380, 0xFFD700);

    this.add.text(W/2, 130, 'BUS RUNNER', {
      fontSize: '16px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 165, 'GAME OVER', {
      fontSize: '12px', color: '#ff4466', fontFamily: PF
    }).setOrigin(0.5);

    const finalScore = Math.floor(this.score);

    this.add.text(W/2, 230, `${finalScore}`, {
      fontSize: '36px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 275, 'SCORE', {
      fontSize: '9px', color: '#888888', fontFamily: PF
    }).setOrigin(0.5);

    // 등급
    let grade, gradeColor;
    if (finalScore >= 3000) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (finalScore >= 1500) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (finalScore >= 800) { grade = 'B'; gradeColor = '#4499ff'; }
    else { grade = 'C'; gradeColor = '#ff4466'; }

    this.add.text(W/2 + 160, 240, grade, {
      fontSize: '60px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    const reward = finalScore >= 1500
      ? 'AGI +7    GP +20'
      : 'AGI +3    GP +5';

    this.add.text(W/2, 340, reward, {
      fontSize: '10px', color: '#aaddff', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 375, 'TIP: DOUBLE JUMP IS AVAILABLE!', {
      fontSize: '7px', color: '#445566', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(270, 440, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 440, 'MENU', 0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg)
      .setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(150, 255, 255, 255, false);
      this.time.delayedCall(150, cb);
    });
  }
}