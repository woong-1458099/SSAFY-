// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

const EXERCISES = [
  { name: 'BENCH PRESS', emoji: '🏋️' },
  { name: 'SQUAT', emoji: '🦵' },
  { name: 'DEADLIFT', emoji: '💪' },
  { name: 'SHOULDER PRESS', emoji: '🏋️' },
];

const MAX_REPS = 10;
const TOTAL_TIME = 40;

export default class GymScene extends Phaser.Scene {
  constructor() { super({ key: 'GymScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.exercise = Phaser.Math.RND.pick(EXERCISES);
    this.reps = 0;
    this.timeLeft = TOTAL_TIME;
    this.gameOver = false;
    this.waiting = false; // 판정 후 대기 상태

    // 게이지 관련
    this.gaugePos = 0; // -1 ~ 1 (좌 ~ 우)
    this.gaugeSpeed = 2.0; // 초당 이동 속도
    this.gaugeDirection = 1; // 1: 오른쪽, -1: 왼쪽

    // 성공 영역 (중앙 기준)
    this.perfectZone = 0.15; // ±0.15 = Perfect
    this.goodZone = 0.35; // ±0.35 = Good

    // 점수
    this.perfectCount = 0;
    this.goodCount = 0;
    this.missCount = 0;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    // 그리드 패턴
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2a2a4e, 0.3);
    for (let x = 0; x < W; x += 40) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) grid.lineBetween(0, y, W, y);

    // 상단 UI
    this.add.rectangle(W / 2, 35, W, 70, 0x0d1545, 0.95);
    this.add.rectangle(W / 2, 0, W, 4, 0xff6600);
    this.add.rectangle(W / 2, 70, W, 3, 0xff6600);

    this.add.text(W / 2, 20, `${this.exercise.emoji} ${this.exercise.name}`, {
      fontSize: '18px', color: '#ff8844', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 50, '타이밍에 맞춰 SPACE를 누르세요!', {
      fontSize: '9px', color: '#88aacc', fontFamily: PF
    }).setOrigin(0.5);

    // 타이머
    this.timerTxt = this.add.text(W - 30, 90, `TIME: ${TOTAL_TIME}`, {
      fontSize: '12px', color: '#ff4466', fontFamily: PF
    }).setOrigin(1, 0);

    // Rep 카운트
    this.repTxt = this.add.text(30, 90, `REPS: 0 / ${MAX_REPS}`, {
      fontSize: '12px', color: '#44ff88', fontFamily: PF
    });

    // 바벨 시각화
    this.buildGymVisual();

    // 타이밍 게이지 UI
    this.buildGauge();

    // 판정 텍스트
    this.judgeTxt = this.add.text(W / 2, 280, '', {
      fontSize: '24px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5).setDepth(10);

    // 힌트
    this.add.text(W / 2, H - 40, '초록 영역에서 SPACE! | Perfect = 더 빠른 게이지', {
      fontSize: '8px', color: '#666688', fontFamily: PF
    }).setOrigin(0.5);

    // 입력
    this.input.keyboard.on('keydown-SPACE', this.handlePress, this);

    // 타이머
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true, callback: this.tick, callbackScope: this
    });
  }

  buildGymVisual() {
    const cx = W / 2, cy = 200;

    // 받침대
    this.add.rectangle(cx - 180, cy + 50, 20, 120, 0x555555);
    this.add.rectangle(cx + 180, cy + 50, 20, 120, 0x555555);

    // 바벨
    this.barbell = this.add.container(cx, cy);
    const bar = this.add.rectangle(0, 0, 340, 14, 0x888888);
    const wL = this.add.rectangle(-150, 0, 30, 60, 0xff6600);
    const wL2 = this.add.rectangle(-175, 0, 22, 80, 0xcc4400);
    const wR = this.add.rectangle(150, 0, 30, 60, 0xff6600);
    const wR2 = this.add.rectangle(175, 0, 22, 80, 0xcc4400);
    this.barbell.add([bar, wL, wL2, wR, wR2]);
    this.barbellBaseY = cy;
  }

  buildGauge() {
    const gaugeY = 380;
    const gaugeWidth = 500;
    const gaugeHeight = 50;

    // 게이지 배경
    this.add.rectangle(W / 2, gaugeY, gaugeWidth + 10, gaugeHeight + 10, 0x000000)
      .setStrokeStyle(3, 0x444466);

    // Miss 영역 (빨강)
    this.add.rectangle(W / 2, gaugeY, gaugeWidth, gaugeHeight, 0x442222);

    // Good 영역 (노랑)
    const goodWidth = gaugeWidth * this.goodZone;
    this.add.rectangle(W / 2, gaugeY, goodWidth * 2, gaugeHeight, 0x444422);

    // Perfect 영역 (초록)
    const perfectWidth = gaugeWidth * this.perfectZone;
    this.add.rectangle(W / 2, gaugeY, perfectWidth * 2, gaugeHeight, 0x224422);

    // 영역 라벨
    this.add.text(W / 2, gaugeY - 35, 'PERFECT', {
      fontSize: '8px', color: '#44ff88', fontFamily: PF
    }).setOrigin(0.5);

    // 이동하는 바 (인디케이터)
    this.indicator = this.add.rectangle(W / 2, gaugeY, 8, gaugeHeight + 6, 0xffffff)
      .setStrokeStyle(2, 0xffff00);

    // 게이지 범위 저장
    this.gaugeLeft = W / 2 - gaugeWidth / 2;
    this.gaugeRight = W / 2 + gaugeWidth / 2;
    this.gaugeWidth = gaugeWidth;
    this.gaugeY = gaugeY;

    // 스피드 표시
    this.speedTxt = this.add.text(W / 2, gaugeY + 45, 'SPEED: x1.0', {
      fontSize: '10px', color: '#ffaa44', fontFamily: PF
    }).setOrigin(0.5);
  }

  handlePress() {
    if (this.gameOver || this.waiting) return;

    this.waiting = true; // 판정 후 잠시 대기

    const absPos = Math.abs(this.gaugePos);
    let judgment = '';
    let color = '';
    let success = false;

    if (absPos <= this.perfectZone) {
      judgment = 'PERFECT!';
      color = '#44ff88';
      this.perfectCount++;
      success = true;
      // Perfect면 속도 증가
      this.gaugeSpeed = Math.min(this.gaugeSpeed + 0.3, 5.0);
    } else if (absPos <= this.goodZone) {
      judgment = 'GOOD!';
      color = '#ffff44';
      this.goodCount++;
      success = true;
      // Good이면 속도 약간 증가
      this.gaugeSpeed = Math.min(this.gaugeSpeed + 0.1, 5.0);
    } else {
      judgment = 'MISS...';
      color = '#ff4444';
      this.missCount++;
      // Miss면 속도 감소
      this.gaugeSpeed = Math.max(this.gaugeSpeed - 0.2, 1.5);
    }

    // 판정 표시
    this.showJudgment(judgment, color);

    // 성공 시 Rep 증가
    if (success) {
      this.reps++;
      this.repTxt.setText(`REPS: ${this.reps} / ${MAX_REPS}`);

      // 바벨 애니메이션
      this.tweens.add({
        targets: this.barbell,
        y: this.barbellBaseY - 80,
        duration: 200,
        yoyo: true,
        ease: 'Cubic.out'
      });

      this.cameras.main.shake(80, 0.005);
    } else {
      this.cameras.main.shake(150, 0.01);
    }

    // 스피드 표시 업데이트
    this.speedTxt.setText(`SPEED: x${this.gaugeSpeed.toFixed(1)}`);

    // 게이지 리셋
    this.time.delayedCall(400, () => {
      if (this.reps >= MAX_REPS) {
        this.gameOver = true;
        this.timerEvent.remove();
        this.time.delayedCall(500, () => this.endGame());
      } else {
        this.gaugePos = -1; // 왼쪽에서 다시 시작
        this.gaugeDirection = 1;
        this.waiting = false;
      }
    });
  }

  showJudgment(text, color) {
    this.judgeTxt.setText(text).setColor(color).setAlpha(1).setScale(1.5);
    this.tweens.add({
      targets: this.judgeTxt,
      alpha: 0,
      scale: 1,
      y: 250,
      duration: 500,
      onComplete: () => this.judgeTxt.setY(280)
    });
  }

  update(time, delta) {
    if (this.gameOver || this.waiting) return;

    // 게이지 이동
    this.gaugePos += this.gaugeDirection * this.gaugeSpeed * (delta / 1000) * 2;

    // 방향 전환
    if (this.gaugePos >= 1) {
      this.gaugePos = 1;
      this.gaugeDirection = -1;
    } else if (this.gaugePos <= -1) {
      this.gaugePos = -1;
      this.gaugeDirection = 1;
    }

    // 인디케이터 위치 업데이트
    const indicatorX = W / 2 + (this.gaugePos * this.gaugeWidth / 2);
    this.indicator.setX(indicatorX);

    // 인디케이터 색상 변경
    const absPos = Math.abs(this.gaugePos);
    if (absPos <= this.perfectZone) {
      this.indicator.setFillStyle(0x44ff88);
    } else if (absPos <= this.goodZone) {
      this.indicator.setFillStyle(0xffff44);
    } else {
      this.indicator.setFillStyle(0xff6666);
    }

    // 바벨 살짝 움직임 (대기 상태 연출)
    const breathe = Math.sin(time / 300) * 3;
    this.barbell.y = this.barbellBaseY + breathe;
  }

  tick() {
    if (this.gameOver) return;

    this.timeLeft--;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);

    if (this.timeLeft <= 5) {
      this.timerTxt.setColor('#ff0000');
    }

    if (this.timeLeft <= 0) {
      this.gameOver = true;
      this.timerEvent.remove();
      this.endGame();
    }
  }

  endGame() {
    this.input.keyboard.off('keydown-SPACE', this.handlePress, this);
    this.children.removeAll();

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    this.add.rectangle(W / 2, 0, W, 4, 0xff6600);

    // 결과 박스
    this.add.rectangle(W / 2, H / 2, 550, 420, 0x0d1545).setStrokeStyle(4, 0xff6600);

    this.add.text(W / 2, 120, '🏋️ TRAINING COMPLETE', {
      fontSize: '20px', color: '#ff8844', fontFamily: PF
    }).setOrigin(0.5);

    // Reps
    this.add.text(W / 2, 180, `${this.reps} REPS`, {
      fontSize: '40px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 판정 통계
    this.add.text(W / 2, 240, `PERFECT: ${this.perfectCount} | GOOD: ${this.goodCount} | MISS: ${this.missCount}`, {
      fontSize: '11px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    // 등급 계산
    let grade, gradeColor, msg, reward;
    const perfectRate = this.reps > 0 ? this.perfectCount / this.reps : 0;

    if (this.reps >= MAX_REPS && perfectRate >= 0.7) {
      grade = 'S';
      gradeColor = '#ffd700';
      msg = '🏆 완벽한 퍼포먼스!';
      reward = '체력 +10, GP +30';
    } else if (this.reps >= MAX_REPS) {
      grade = 'A';
      gradeColor = '#44ff88';
      msg = '💪 훌륭해요!';
      reward = '체력 +7, GP +20';
    } else if (this.reps >= 7) {
      grade = 'B';
      gradeColor = '#4499ff';
      msg = '👍 좋아요!';
      reward = '체력 +5, GP +10';
    } else if (this.reps >= 4) {
      grade = 'C';
      gradeColor = '#ffaa44';
      msg = '😤 더 노력해봐요';
      reward = '체력 +3, GP +5';
    } else {
      grade = 'D';
      gradeColor = '#ff4466';
      msg = '😢 다음에 다시...';
      reward = '체력 +1';
    }

    this.add.text(W / 2 + 120, 180, grade, {
      fontSize: '50px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, msg, {
      fontSize: '14px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 340, `보상: ${reward}`, {
      fontSize: '12px', color: '#ffd700', fontFamily: PF
    }).setOrigin(0.5);

    // 버튼
    this.createBtn(W / 2 - 120, 420, '다시하기', 0x442200, 0xff6600, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 420, '메뉴', 0x222244, 0x4488ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(100, 255, 255, 255);
      this.time.delayedCall(100, cb);
    });
  }

  shutdown() {
    this.input.keyboard.off('keydown-SPACE', this.handlePress, this);
    if (this.timerEvent) this.timerEvent.remove();
  }
}
