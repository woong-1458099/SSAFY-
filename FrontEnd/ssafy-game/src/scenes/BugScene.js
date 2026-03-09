import Phaser from 'phaser';

const PF = '"Press Start 2P"';

const BUGS = ['🐛', '🐞', '🦗', '🕷️', '🐜'];

export default class BugScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BugScene' });
  }

  create() {
    const W = 800, H = 600;

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.missed = 0;
    this.timeLeft = 30;
    this.gameOver = false;
    this.bugs = [];
    this.spawnDelay = 1200;

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 별
    for (let i = 0; i < 30; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2),
        0xffffff, 0.3
      );
      this.tweens.add({
        targets: star, alpha: 0.8,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true, repeat: -1
      });
    }

    // 상단 HUD
    this.add.rectangle(W/2, 30, W, 60, 0x0d1545, 0.95);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W/2, 60, W, 3, 0x4488ff);

    this.add.text(W/2, 16, 'BUG CRUSH', {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    // 점수
    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    });

    // 콤보
    this.comboTxt = this.add.text(20, 30, '', {
      fontSize: '8px', color: '#FFD700', fontFamily: PF
    });

    // 타이머
    this.timerTxt = this.add.text(W - 20, 12, 'TIME: 30', {
      fontSize: '9px', color: '#ff4466', fontFamily: PF
    }).setOrigin(1, 0);

    // 미스
    this.missedTxt = this.add.text(W - 20, 30, 'MISS: 0', {
      fontSize: '8px', color: '#888888', fontFamily: PF
    }).setOrigin(1, 0);

    // 타이머 바
    this.add.rectangle(W/2, 57, W - 40, 6, 0x333355);
    this.timerBar = this.add.rectangle(20, 57, W - 40, 6, 0x00cc66).setOrigin(0, 0.5);

    // 판정 텍스트
    this.judgeTxt = this.add.text(W/2, 300, '', {
      fontSize: '16px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // 게임 영역 테두리
    this.add.rectangle(W/2, 340, W - 40, 510, 0x000000, 0)
      .setStrokeStyle(2, 0x333355);

    // 버그 스폰 시작
    this.spawnBug();
    this.spawnEvent = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: () => {
        if (!this.gameOver) this.spawnBug();
      }
    });

    // 타이머
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: this.tick, callbackScope: this
    });

    // 클릭 이벤트 (미스 클릭 감지)
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver) return;
      // 버그를 못 잡았을 때 (빈 공간 클릭)
      const hitBug = this.bugs.some(bug =>
        bug && bug.active &&
        Phaser.Geom.Rectangle.Contains(
          bug.getBounds(), pointer.x, pointer.y
        )
      );
      // 빈 공간 클릭하면 콤보 리셋
      if (!hitBug) {
        this.combo = 0;
        this.updateHUD();
      }
    });
  }

  spawnBug() {
    if (this.gameOver) return;

    const W = 800, H = 600;
    const x = Phaser.Math.Between(60, W - 60);
    const y = Phaser.Math.Between(90, H - 60);
    const emoji = Phaser.Math.RND.pick(BUGS);

    // 버그 컨테이너
    const bug = this.add.container(x, y);

    // 배경 원
    const circle = this.add.circle(0, 0, 35, 0x1a1a3e)
      .setStrokeStyle(3, 0xff4466);

    // 버그 이모지
    const bugTxt = this.add.text(0, 0, emoji, {
      fontSize: '28px'
    }).setOrigin(0.5);

    bug.add([circle, bugTxt]);
    bug.setSize(70, 70);
    bug.setInteractive();
    bug.setDepth(5);

    // 등장 애니메이션
    bug.setScale(0);
    this.tweens.add({
      targets: bug, scale: 1,
      duration: 200, ease: 'Back.easeOut'
    });

    // 흔들림 애니메이션
    this.tweens.add({
      targets: bug,
      x: x + Phaser.Math.Between(-15, 15),
      y: y + Phaser.Math.Between(-15, 15),
      duration: 400, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 수명 (난이도에 따라 짧아짐)
    const lifeTime = Math.max(1500, 3000 - (30 - this.timeLeft) * 50);

    const lifeTimer = this.time.delayedCall(lifeTime, () => {
      if (bug.active && !this.gameOver) {
        // 버그 도망 애니메이션
        this.tweens.add({
          targets: bug, scale: 0, duration: 200,
          onComplete: () => {
            bug.destroy();
            this.missed++;
            this.combo = 0;
            this.cameras.main.shake(100, 0.003);
            this.updateHUD();
          }
        });
        this.bugs = this.bugs.filter(b => b !== bug);
      }
    });

    // 클릭 이벤트
    bug.on('pointerdown', () => {
      if (this.gameOver) return;

      lifeTimer.remove();
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      // 콤보에 따라 점수 다르게
      let pts, judgeText, judgeColor;
      if (this.combo >= 10) {
        pts = 500; judgeText = 'FEVER!! +500'; judgeColor = '#ff44ff';
      } else if (this.combo >= 5) {
        pts = 200; judgeText = `${this.combo} COMBO! +200`; judgeColor = '#FFD700';
      } else {
        pts = 100; judgeText = '+100'; judgeColor = '#44ff88';
      }

      this.score += pts;

      // 점수 팝업
      const popup = this.add.text(bug.x, bug.y, `+${pts}`, {
        fontSize: '12px', color: judgeColor, fontFamily: PF
      }).setOrigin(0.5).setDepth(10);

      this.tweens.add({
        targets: popup, y: bug.y - 60, alpha: 0,
        duration: 600, ease: 'Power2',
        onComplete: () => popup.destroy()
      });

      // 판정 텍스트
      this.showJudge(judgeText, judgeColor);

      // 터짐 효과
      this.explodeBug(bug.x, bug.y, circle.strokeColor);

      bug.destroy();
      this.bugs = this.bugs.filter(b => b !== bug);
      this.updateHUD();
    });

    // 호버 효과
    bug.on('pointerover', () => {
      this.tweens.add({ targets: bug, scale: 1.2, duration: 100 });
    });
    bug.on('pointerout', () => {
      this.tweens.add({ targets: bug, scale: 1, duration: 100 });
    });

    this.bugs.push(bug);
  }

  explodeBug(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.add.rectangle(
        x, y, 6, 6, color || 0xff4466
      ).setDepth(8);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0, scale: 0,
        duration: 400, ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  showJudge(text, color) {
    this.judgeTxt.setText(text).setColor(color).setAlpha(1).setY(320);
    this.tweens.add({
      targets: this.judgeTxt, alpha: 0, y: 280,
      duration: 700, ease: 'Power2'
    });
  }

  updateHUD() {
    this.scoreTxt.setText(`SCORE: ${this.score}`);
    this.comboTxt.setText(this.combo > 1 ? `${this.combo} COMBO!` : '');
    this.missedTxt.setText(`MISS: ${this.missed}`);
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft--;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);

    const ratio = this.timeLeft / 30;
    this.timerBar.setScale(ratio, 1);
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff4444);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    else this.timerBar.setFillStyle(0x00cc66);

    // 시간 지날수록 스폰 빨라짐
    if (this.timeLeft === 20) {
      this.spawnEvent.delay = 900;
    } else if (this.timeLeft === 10) {
      this.spawnEvent.delay = 600;
    }

    if (this.timeLeft <= 0) {
      this.gameOver = true;
      this.spawnEvent.remove();
      this.timerEvent.remove();
      this.time.delayedCall(500, () => this.endGame());
    }
  }

  endGame() {
    this.children.removeAll();
    const W = 800, H = 600;

    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);

    this.add.rectangle(W/2 + 3, H/2 + 3, 620, 400, 0x000000, 0.8);
    this.add.rectangle(W/2, H/2, 620, 400, 0x0d1545);
    this.add.rectangle(W/2, H/2 - 198, 620, 4, 0xFFD700);
    this.add.rectangle(W/2, H/2 + 198, 620, 4, 0xFFD700);
    this.add.rectangle(W/2 - 308, H/2, 4, 400, 0xFFD700);
    this.add.rectangle(W/2 + 308, H/2, 4, 400, 0xFFD700);

    this.add.text(W/2, 120, 'BUG CRUSH', {
      fontSize: '18px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);
    this.add.text(W/2, 150, 'RESULT', {
      fontSize: '12px', color: '#888888', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 210, `${this.score}`, {
      fontSize: '36px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    const stats = [
      { label: 'MAX COMBO', value: this.maxCombo, color: '#FFD700' },
      { label: 'MISSED',    value: this.missed,   color: '#ff4466' },
    ];

    stats.forEach((s, i) => {
      this.add.text(W/2 - 150, 280 + i * 45, s.label, {
        fontSize: '9px', color: '#888888', fontFamily: PF
      }).setOrigin(0, 0.5);
      this.add.text(W/2 + 150, 280 + i * 45, String(s.value), {
        fontSize: '11px', color: s.color, fontFamily: PF
      }).setOrigin(1, 0.5);
    });

    // 등급
    let grade, gradeColor;
    if (this.score >= 5000) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (this.score >= 3000) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (this.score >= 1500) { grade = 'B'; gradeColor = '#4499ff'; }
    else { grade = 'C'; gradeColor = '#ff4466'; }

    this.add.text(W/2 + 180, 290, grade, {
      fontSize: '60px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    const reward = this.score >= 3000 ? 'INT +7    GP +20' : 'INT +3    GP +5';
    this.add.text(W/2, 390, reward, {
      fontSize: '10px', color: '#aaddff', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(270, 460, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 460, 'MENU',  0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
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