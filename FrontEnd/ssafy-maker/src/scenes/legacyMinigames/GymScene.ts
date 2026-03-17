// @ts-nocheck
import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

const EXERCISES = [
  { name: 'BENCH PRESS', keyA: 'LEFT', keyB: 'RIGHT', top: '←→', desc: '← → 교대로 눌러라!' },
  { name: 'SQUAT',       keyA: 'LEFT', keyB: 'RIGHT', top: '←→', desc: '← → 교대로 눌러라!' },
  { name: 'BICEP CURL',  keyA: 'Z',    keyB: 'X',    top: 'Z X',  desc: 'Z X 교대로 눌러라!' },
  { name: 'PUSH-UP',     keyA: 'Z',    keyB: 'X',    top: 'Z X',  desc: 'Z X 교대로 눌러라!' },
];

const TOTAL_TIME = 30;
const MAX_REPS = 15;

export default class GymScene extends Phaser.Scene {
  constructor() { super({ key: 'GymScene' }); }

  create() {
    applyLegacyViewport(this);
    const W = 800, H = 600;

    // 운동 랜덤 선택
    this.exercise = Phaser.Math.RND.pick(EXERCISES);
    this.reps = 0;
    this.repProgress = 0; // 0 ~ 1 (한 rep 내 진행도, A누름=0.5, B누름=1.0)
    this.lastPressed = null; // 마지막으로 누른 키
    this.timeLeft = TOTAL_TIME;
    this.gameOver = false;
    this.halfDone = false; // A 눌린 상태

    // ── 배경 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x111111);
    for (let x = 0; x < W; x += 40) this.add.rectangle(x, H / 2, 1, H, 0x222222, 0.6);
    for (let y = 0; y < H; y += 40) this.add.rectangle(W / 2, y, W, 1, 0x222222, 0.6);

    // 상단 바
    this.add.rectangle(W / 2, 30, W, 60, 0x1a0a00, 0.97);
    this.add.rectangle(W / 2, 4, W, 6, 0xff8800);
    this.add.rectangle(W / 2, 60, W, 3, 0xff4400);
    this.add.text(W / 2, 16, 'GYM TRAINING', { fontSize: '14px', color: '#ff8800', fontFamily: PF }).setOrigin(0.5, 0);

    // 운동 이름
    this.add.text(W / 2, 100, this.exercise.name, { fontSize: '22px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 136, this.exercise.desc, { fontSize: '9px', color: '#ffcc88', fontFamily: PF }).setOrigin(0.5);

    // 타이머
    this.timerTxt = this.add.text(W - 20, 12, `TIME: ${TOTAL_TIME}`, { fontSize: '9px', color: '#ff4400', fontFamily: PF }).setOrigin(1, 0);
    this.add.rectangle(W / 2, 57, W - 40, 6, 0x332211);
    this.timerBar = this.add.rectangle(20, 57, W - 40, 6, 0xff6600).setOrigin(0, 0.5);

    // ── 바벨 / 운동 시각화 ──
    this.buildGymVisual(W, H);

    // REP 진행 바 (한 rep 내)
    this.add.text(W / 2, 340, 'REP POWER', { fontSize: '8px', color: '#888888', fontFamily: PF }).setOrigin(0.5);
    this.add.rectangle(W / 2, 364, 500, 28, 0x221100);
    this.add.rectangle(W / 2, 364, 500, 28, 0x000000, 0).setStrokeStyle(2, 0xff6600);
    this.repBar = this.add.rectangle(W / 2 - 250, 364, 0, 24, 0xff6600).setOrigin(0, 0.5);

    // A/B 키 표시
    this.keyABox = this.add.rectangle(W / 2 - 80, 420, 100, 60, 0x330000).setStrokeStyle(3, 0xff6600);
    this.keyATxt = this.add.text(W / 2 - 80, 420, this.exercise.top.split(' ')[0] || '←', { fontSize: '18px', color: '#ff8800', fontFamily: PF }).setOrigin(0.5);
    this.keyBBox = this.add.rectangle(W / 2 + 80, 420, 100, 60, 0x330000).setStrokeStyle(3, 0x444444);
    this.keyBTxt = this.add.text(W / 2 + 80, 420, this.exercise.top.split(' ')[1] || '→', { fontSize: '18px', color: '#888888', fontFamily: PF }).setOrigin(0.5);

    // NEXT 화살표 표시
    this.nextTxt = this.add.text(W / 2, 458, '▼ 먼저 ← 를 눌러라!', { fontSize: '8px', color: '#ffcc44', fontFamily: PF }).setOrigin(0.5);

    // REP 카운터
    this.add.text(W / 2, 490, 'REPS', { fontSize: '8px', color: '#888888', fontFamily: PF }).setOrigin(0.5);
    this.repTxt = this.add.text(W / 2, 516, `0 / ${MAX_REPS}`, { fontSize: '22px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);

    // 판정 텍스트
    this.judgeTxt = this.add.text(W / 2, 295, '', { fontSize: '16px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // 키 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.input.keyboard.on('keydown', this.handleKey, this);

    // 타이머
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: this.tick, callbackScope: this });
  }

  buildGymVisual(W, H) {
    // 바벨 (운동 기구 시각화)
    const cx = W / 2, cy = 230;

    // 받침대
    this.add.rectangle(cx - 160, cy + 40, 20, 100, 0x555555);
    this.add.rectangle(cx + 160, cy + 40, 20, 100, 0x555555);
    // 바
    this.barbellBar = this.add.rectangle(cx, cy, 320, 16, 0x999999);
    // 왼쪽 원판
    this.weightL = this.add.rectangle(cx - 140, cy, 28, 60, 0xcc4400);
    this.weightL2 = this.add.rectangle(cx - 160, cy, 20, 70, 0x884400);
    // 오른쪽 원판
    this.weightR = this.add.rectangle(cx + 140, cy, 28, 60, 0xcc4400);
    this.weightR2 = this.add.rectangle(cx + 160, cy, 20, 70, 0x884400);

    // 바 y 위치 (운동 진행에 따라 상하 이동)
    this.barbellBaseY = cy;
  }

  handleKey(event) {
    if (this.gameOver) return;

    const key = event.key;
    const isA =
      (this.exercise.keyA === 'LEFT' && (key === 'ArrowLeft')) ||
      (this.exercise.keyA === 'Z' && key.toLowerCase() === 'z');
    const isB =
      (this.exercise.keyB === 'RIGHT' && (key === 'ArrowRight')) ||
      (this.exercise.keyB === 'X' && key.toLowerCase() === 'x');

    if (!isA && !isB) return;

    // A → B 순서로만 받기
    if (isA && !this.halfDone) {
      // 첫 입력 A
      this.halfDone = true;
      this.repProgress = 0.5;
      this.flashKey('A');
      this.updateNextHint();
      this.updateRepBar();
      this.animateBarbell(true);
    } else if (isB && this.halfDone) {
      // 두 번째 입력 B → rep 완료
      this.halfDone = false;
      this.repProgress = 0;
      this.reps += 1;
      this.flashKey('B');
      this.animateBarbell(false);
      this.showJudge(this.reps >= MAX_REPS ? 'MAX REP!!' : 'REP!', this.reps >= MAX_REPS ? '#FFD700' : '#44ff88');
      this.updateRepBar();
      this.updateNextHint();
      this.repTxt.setText(`${this.reps} / ${MAX_REPS}`);
      if (this.reps >= MAX_REPS) {
        this.gameOver = true;
        this.timerEvent.remove();
        this.time.delayedCall(600, () => this.endGame());
      }
    } else if (isA && this.halfDone) {
      // 잘못된 순서 (A 연속)
      this.halfDone = false;
      this.repProgress = 0;
      this.updateRepBar();
      this.showJudge('순서 틀림!', '#ff4444');
    }
  }

  flashKey(which) {
    const box = which === 'A' ? this.keyABox : this.keyBBox;
    const txt = which === 'A' ? this.keyATxt : this.keyBTxt;
    const origColor = 0xff6600;
    box.setFillStyle(origColor);
    txt.setColor('#ffffff');
    this.time.delayedCall(120, () => {
      box.setFillStyle(0x330000);
      txt.setColor(which === 'A' ? '#ff8800' : '#888888');
    });
  }

  updateNextHint() {
    if (this.halfDone) {
      const btnB = this.exercise.top.split(' ')[1] || '→';
      this.nextTxt.setText(`▼ 이제 ${btnB} 를 눌러라!`);
      this.keyABox.setStrokeStyle(3, 0x444444);
      this.keyBBox.setStrokeStyle(3, 0xff6600);
      this.keyATxt.setColor('#888888');
      this.keyBTxt.setColor('#ff8800');
    } else {
      const btnA = this.exercise.top.split(' ')[0] || '←';
      this.nextTxt.setText(`▼ 먼저 ${btnA} 를 눌러라!`);
      this.keyABox.setStrokeStyle(3, 0xff6600);
      this.keyBBox.setStrokeStyle(3, 0x444444);
      this.keyATxt.setColor('#ff8800');
      this.keyBTxt.setColor('#888888');
    }
  }

  updateRepBar() {
    this.repBar.width = 500 * this.repProgress;
  }

  animateBarbell(goUp) {
    const targetY = goUp ? this.barbellBaseY - 30 : this.barbellBaseY;
    this.tweens.add({
      targets: [this.barbellBar, this.weightL, this.weightL2, this.weightR, this.weightR2],
      y: (obj) => obj === this.barbellBar ? targetY : (goUp ? obj.y - 30 : obj.y + 30),
      duration: 120,
      ease: 'Power2',
    });
  }

  showJudge(text, color) {
    this.judgeTxt.setText(text).setColor(color).setAlpha(1).setScale(1);
    this.tweens.add({ targets: this.judgeTxt, alpha: 0, y: this.judgeTxt.y - 30, duration: 500, ease: 'Power2', onComplete: () => this.judgeTxt.setY(295).setScale(1) });
  }

  tick() {
    if (this.gameOver) return;
    this.timeLeft -= 1;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);
    const ratio = this.timeLeft / TOTAL_TIME;
    this.timerBar.scaleX = ratio;
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff2200);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    if (this.timeLeft <= 0) {
      this.gameOver = true;
      this.timerEvent.remove();
      this.time.delayedCall(500, () => this.endGame());
    }
  }

  endGame() {
    this.input.keyboard.off('keydown', this.handleKey, this);
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
    this.add.text(W / 2, 115, 'GYM RESULT', { fontSize: '18px', color: '#ff8800', fontFamily: PF }).setOrigin(0.5);

    const repsDone = this.reps;
    this.add.text(W / 2, 175, `${repsDone} REPS`, { fontSize: '32px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 225, this.exercise.name, { fontSize: '9px', color: '#888888', fontFamily: PF }).setOrigin(0.5);

    let grade = 'C', gradeColor = '#ff4466', reward = 'STR +2  HP +5';
    if (repsDone >= MAX_REPS)    { grade = 'S'; gradeColor = '#FFD700'; reward = 'STR +10  HP +30  GP +20'; }
    else if (repsDone >= 10) { grade = 'A'; gradeColor = '#00ff88'; reward = 'STR +7   HP +20  GP +10'; }
    else if (repsDone >= 6)  { grade = 'B'; gradeColor = '#4499ff'; reward = 'STR +5   HP +12  GP +5'; }

    this.add.text(W / 2 + 200, 260, grade, { fontSize: '70px', color: gradeColor, fontFamily: PF }).setOrigin(0.5);

    [
      { label: 'REPS DONE',   value: `${repsDone}`, color: '#ffffff' },
      { label: 'TARGET',      value: `${MAX_REPS}`, color: '#aaaaaa' },
      { label: 'COMPLETION',  value: `${Math.floor((repsDone / MAX_REPS) * 100)}%`, color: '#ffcc44' },
    ].forEach((s, i) => {
      this.add.text(W / 2 - 150, 285 + i * 42, s.label, { fontSize: '8px', color: '#888888', fontFamily: PF }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 100, 285 + i * 42, s.value, { fontSize: '10px', color: s.color, fontFamily: PF }).setOrigin(1, 0.5);
    });

    this.add.text(W / 2, 415, reward, { fontSize: '9px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);

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
