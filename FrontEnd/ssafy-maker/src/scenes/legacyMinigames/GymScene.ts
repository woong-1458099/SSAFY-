// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

const EXERCISES = [
  { name: 'BENCH PRESS', desc: 'SPACE를 연타해서 들어올려라!' },
  { name: 'SQUAT',       desc: 'SPACE를 연타해서 들어올려라!' },
  { name: 'BICEP CURL',  desc: 'SPACE를 연타해서 들어올려라!' },
  { name: 'PUSH-UP',     desc: 'SPACE를 연타해서 들어올려라!' },
];

const TOTAL_TIME = 30;
const MAX_REPS = 10;
const POWER_DECAY = 0.015; // 초마다 감소하는 기본 양 (실제론 프레임당 계산)
const POWER_GAIN = 0.12;  // 한 번 누를 때 상승폭

export default class GymScene extends Phaser.Scene {
  constructor() { super({ key: 'GymScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);
    const W = 800, H = 600;

    this.exercise = Phaser.Math.RND.pick(EXERCISES);
    this.reps = 0;
    this.power = 0; // 0 ~ 1.0 (연타로 채우는 게이지)
    this.timeLeft = TOTAL_TIME;
    this.gameOver = false;

    // ── 배경 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x111111);
    for (let x = 0; x < W; x += 40) this.add.rectangle(x, H / 2, 1, H, 0x222222, 0.6);
    for (let y = 0; y < H; y += 40) this.add.rectangle(W / 2, y, W, 1, 0x222222, 0.6);

    // 상단 UI
    this.add.rectangle(W / 2, 30, W, 60, 0x1a0a00, 0.97);
    this.add.rectangle(W / 2, 4, W, 6, 0xff8800);
    this.add.rectangle(W / 2, 60, W, 3, 0xff4400);
    this.add.text(W / 2, 16, 'SSAFY GYM: SA STYLE', { fontSize: '14px', color: '#ff8800', fontFamily: PF }).setOrigin(0.5, 0);

    // 타이머
    this.timerTxt = this.add.text(W - 20, 12, `TIME: ${TOTAL_TIME}`, { fontSize: '9px', color: '#ff4400', fontFamily: PF }).setOrigin(1, 0);
    this.timerBarBase = this.add.rectangle(W / 2, 57, W - 40, 6, 0x332211);
    this.timerBar = this.add.rectangle(20, 57, W - 40, 6, 0xff6600).setOrigin(0, 0.5);

    // 제목/설명
    this.add.text(W / 2, 100, this.exercise.name, { fontSize: '22px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 136, this.exercise.desc, { fontSize: '9px', color: '#ffcc88', fontFamily: PF }).setOrigin(0.5);

    // 기구 시각화
    this.buildGymVisual(W, H);

    // ── POWER GAUGE (GTA 스타일) ──
    const GX = 650, GY = 300, GW = 40, GH = 250;
    this.add.text(GX, GY - 145, 'POWER', { fontSize: '10px', color: '#ffcc44', fontFamily: PF }).setOrigin(0.5);
    this.add.rectangle(GX, GY, GW, GH, 0x000000).setStrokeStyle(4, 0x444444);
    this.powerBar = this.add.rectangle(GX, GY + GH/2, GW - 8, 0, 0xffcc44).setOrigin(0.5, 1);
    
    // 연타 버튼 힌트
    this.spaceBtn = this.add.container(W / 2, 460);
    this.spaceBg = this.add.rectangle(0, 0, 240, 50, 0x331100).setStrokeStyle(3, 0xff8800);
    this.spaceTxt = this.add.text(0, 0, 'PRESS SPACE', { fontSize: '16px', color: '#ff8800', fontFamily: PF }).setOrigin(0.5);
    this.spaceBtn.add([this.spaceBg, this.spaceTxt]);

    // Rep 카운트
    this.add.text(W / 2, 530, 'REPS', { fontSize: '10px', color: '#888888', fontFamily: PF }).setOrigin(0.5);
    this.repTxt = this.add.text(W / 2, 560, `0 / ${MAX_REPS}`, { fontSize: '26px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);

    // 판정
    this.judgeTxt = this.add.text(W / 2, 290, '', { fontSize: '18px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // 입력
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.on('keydown-SPACE', this.handleMash, this);

    // 타이머/업데이트 루프
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });
  }

  buildGymVisual(W, H) {
    const cx = W / 2, cy = 250;
    // 받침대
    this.add.rectangle(cx - 160, cy + 40, 20, 100, 0x555555);
    this.add.rectangle(cx + 160, cy + 40, 20, 100, 0x555555);
    // 바벨
    this.barbell = this.add.container(cx, cy);
    const bar = this.add.rectangle(0, 0, 320, 16, 0x999999);
    const wL = this.add.rectangle(-140, 0, 28, 70, 0xcc4400);
    const wL2 = this.add.rectangle(-165, 0, 20, 85, 0x884400);
    const wR = this.add.rectangle(140, 0, 28, 70, 0xcc4400);
    const wR2 = this.add.rectangle(165, 0, 20, 85, 0x884400);
    this.barbell.add([bar, wL, wL2, wR, wR2]);
    this.barbellBaseY = cy;
  }

  handleMash() {
    if (this.gameOver) return;
    
    // 파워 상승
    this.power = Math.min(1.0, this.power + POWER_GAIN);
    
    // 시각적 피드백
    this.spaceBg.setFillStyle(0xff8800);
    this.spaceTxt.setColor('#ffffff');
    this.time.delayedCall(80, () => {
      this.spaceBg.setFillStyle(0x331100);
      this.spaceTxt.setColor('#ff8800');
    });

    // 100% 도달 시 Rep 성공
    if (this.power >= 1.0) {
      this.completeRep();
    }
  }

  completeRep() {
    this.reps += 1;
    this.power = 0; // 게이지 초기화
    this.repTxt.setText(`${this.reps} / ${MAX_REPS}`);
    
    // 성공 연타 효과
    this.showJudge('REP!', '#44ff88');
    this.sound.play('click'); // 사운드 있으면 재생

    // 바벨 애니메이션
    this.tweens.add({
        targets: this.barbell,
        y: this.barbellBaseY - 60,
        duration: 200,
        yoyo: true,
        ease: 'Cubic.out'
    });

    if (this.reps >= MAX_REPS) {
      this.gameOver = true;
      this.timerEvent.remove();
      this.showJudge('MAXIMUM GAIN!!', '#FFD700');
      this.time.delayedCall(1000, () => this.endGame());
    }
  }

  update(time, delta) {
    if (this.gameOver) return;

    // 파워 감쇠 (초당 횟수가 많아질수록 더 빨리 감소)
    const decayFactor = 0.3 + (this.reps * 0.08); // Reps가 늘수록 더 빨리 빠짐
    this.power = Math.max(0, this.power - (decayFactor * (delta / 1000)));

    // 파워 바 업데이트
    this.powerBar.height = 242 * this.power;
    
    // 게이지 색상 변경 (뜨거워지는 연출)
    if (this.power > 0.8) this.powerBar.setFillStyle(0xff4422);
    else if (this.power > 0.5) this.powerBar.setFillStyle(0xffaa00);
    else this.powerBar.setFillStyle(0xffcc44);

    // 바벨 위치를 파워에 살짝 연동 (실시간 리프팅 느낌)
    const liftY = this.barbellBaseY - (this.power * 40);
    this.barbell.y = liftY;
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft -= 1;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);
    const ratio = this.timeLeft / TOTAL_TIME;
    this.timerBar.scaleX = ratio;
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff2200);
    
    if (this.timeLeft <= 0) {
      this.gameOver = true;
      this.timerEvent.remove();
      this.endGame();
    }
  }

  showJudge(text, color) {
    this.judgeTxt.setText(text).setColor(color).setAlpha(1).setScale(1.5).setY(290);
    this.tweens.add({ targets: this.judgeTxt, alpha: 0, y: 240, duration: 600, ease: 'Power2' });
  }

  endGame() {
    this.input.keyboard.off('keydown-SPACE', this.handleMash, this);
    this.children.removeAll();
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x111111);
    this.add.rectangle(W / 2, 4, W, 6, 0xff8800);
    this.add.rectangle(W / 2 + 3, H / 2 + 3, 620, 420, 0x000000, 0.8);
    this.add.rectangle(W / 2, H / 2, 620, 420, 0x1a0800);
    this.add.rectangle(W / 2, H / 2 - 208, 620, 4, 0xff8800);
    this.add.rectangle(W / 2, H / 2 + 208, 620, 4, 0xff8800);
    this.add.rectangle(W / 2 - 308, H / 2, 4, 420, 0xff8800);
    this.add.rectangle(W / 2 + 308, H / 2, 4, 420, 0xff8800);
    
    this.add.text(W / 2, 115, 'TRAINING RESULT', { fontSize: '18px', color: '#ff8800', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 175, `${this.reps} REPS`, { fontSize: '36px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    
    let grade = 'C', gradeColor = '#ff4466', reward = 'STR +2  HP +5';
    if (this.reps >= MAX_REPS) { grade = 'S'; gradeColor = '#FFD700'; reward = 'STR +10  HP +30  GP +20'; }
    else if (this.reps >= 7) { grade = 'A'; gradeColor = '#00ff88'; reward = 'STR +7   HP +20  GP +10'; }
    else if (this.reps >= 4) { grade = 'B'; gradeColor = '#4499ff'; reward = 'STR +5   HP +12  GP +5'; }

    this.add.text(W / 2 + 200, 270, grade, { fontSize: '80px', color: gradeColor, fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 415, reward, { fontSize: '10px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);

    this.createBtn(270, 490, 'RETRY', 0x440000, 0xff6600, () => this.scene.restart());
    this.createBtn(530, 490, 'MENU',  0x001888, 0x4499ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout',  () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.cameras.main.flash(150, 255, 180, 0, false); this.time.delayedCall(150, cb); });
  }
}
