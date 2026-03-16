// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';

// ── 난이도 설정 ──────────────────────────────────────────
const DIFFICULTY = {
  EASY:   { label: 'EASY',   noteSpeed: 200, perfectRange: 80, goodRange: 140, color: 0x44ff88, labelColor: '#44ff88',  noteCount: 15 },
  NORMAL: { label: 'NORMAL', noteSpeed: 300, perfectRange: 50, goodRange: 90,  color: 0xffcc00, labelColor: '#ffcc00', noteCount: 20 },
  HARD:   { label: 'HARD',   noteSpeed: 460, perfectRange: 28, goodRange: 55,  color: 0xff4466, labelColor: '#ff4466',  noteCount: 32 },
};

// ── 레인 설정 ────────────────────────────────────────────
const LANES = [
  { key: 'A', x: 200, color: 0xff4466, darkColor: 0x881133 },
  { key: 'S', x: 310, color: 0xffaa00, darkColor: 0x886600 },
  { key: 'D', x: 420, color: 0x44ff88, darkColor: 0x228844 },
  { key: 'F', x: 530, color: 0x4499ff, darkColor: 0x224488 },
];
const LANE_KEYS = ['A', 'S', 'D', 'F'];
const HIT_Y = 490;

// ── 노트 패턴 생성 (베이스 패턴 × 난이도에 따라 수 조절) ──
function generateNotes(count) {
  const basePattern = [
    { key: 'A', time: 1000 }, { key: 'S', time: 1500 }, { key: 'D', time: 2000 }, { key: 'F', time: 2500 },
    { key: 'A', time: 3000 }, { key: 'D', time: 3500 }, { key: 'S', time: 4000 }, { key: 'F', time: 4500 },
    { key: 'A', time: 5000 }, { key: 'S', time: 5000 }, { key: 'D', time: 5500 }, { key: 'F', time: 6000 },
    { key: 'A', time: 6500 }, { key: 'S', time: 7000 }, { key: 'D', time: 7500 }, { key: 'F', time: 7500 },
    { key: 'A', time: 8000 }, { key: 'S', time: 8500 }, { key: 'D', time: 9000 }, { key: 'F', time: 9500 },
    // HARD 추가 노트
    { key: 'S', time: 10000 }, { key: 'A', time: 10300 }, { key: 'F', time: 10600 }, { key: 'D', time: 10900 },
    { key: 'A', time: 11200 }, { key: 'S', time: 11400 }, { key: 'D', time: 11600 }, { key: 'F', time: 11800 },
    { key: 'A', time: 12000 }, { key: 'F', time: 12200 }, { key: 'S', time: 12500 }, { key: 'D', time: 12800 },
  ];
  return basePattern.slice(0, count);
}

export default class RhythmScene extends Phaser.Scene {
  constructor() { super({ key: 'RhythmScene' }); }

  create() {
    applyLegacyViewport(this);
    this.selectedDiff = null;
    this.drawDifficultySelect();
  }

  // ── 난이도 선택 화면 ──────────────────────────────────────
  drawDifficultySelect() {
    const W = 800, H = 600;
    this.diffRoot = this.add.container(0, 0);

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    for (let i = 0; i < 30; i++) {
      const star = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2), 0xffffff, 0.3);
      this.tweens.add({ targets: star, alpha: 0.8, duration: Phaser.Math.Between(400, 1400), yoyo: true, repeat: -1 });
    }
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    const title = this.add.text(W / 2, 100, 'RHYTHM GAME', { fontSize: '22px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    const sub = this.add.text(W / 2, 148, '난이도를 선택하세요', { fontSize: '10px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);
    this.diffRoot.add([bg, title, sub]);

    const diffs = Object.values(DIFFICULTY);
    diffs.forEach((diff, i) => {
      const x = 160 + i * 240;
      const y = 310;
      this.createDiffCard(x, y, diff);
    });
  }

  createDiffCard(x, y, diff) {
    const card = this.add.rectangle(x, y, 200, 260, 0x0d1545).setStrokeStyle(3, diff.color).setInteractive({ useHandCursor: true });
    const labelTxt = this.add.text(x, y - 90, diff.label, { fontSize: '14px', color: diff.labelColor, fontFamily: PF }).setOrigin(0.5);

    const details = [
      `노트 속도: ${diff.noteSpeed === 200 ? '느림' : diff.noteSpeed === 300 ? '보통' : '빠름'}`,
      `판정: ${diff.perfectRange >= 80 ? '넓음' : diff.perfectRange >= 50 ? '보통' : '좁음'}`,
      `노트 수: ${diff.noteCount}개`,
    ];
    details.forEach((line, j) => {
      this.add.text(x, y - 30 + j * 36, line, { fontSize: '7px', color: '#ccddff', fontFamily: PF }).setOrigin(0.5);
    });

    const btnBg = this.add.rectangle(x, y + 95, 160, 42, 0x002244).setStrokeStyle(2, diff.color);
    const btnTxt = this.add.text(x, y + 95, '선택', { fontSize: '10px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);

    card.on('pointerover', () => { card.setFillStyle(0x1a2a6a); this.tweens.add({ targets: [card, labelTxt], scaleX: 1.04, scaleY: 1.04, duration: 80 }); });
    card.on('pointerout',  () => { card.setFillStyle(0x0d1545); this.tweens.add({ targets: [card, labelTxt], scaleX: 1, scaleY: 1, duration: 80 }); });
    card.on('pointerdown', () => {
      this.cameras.main.flash(100, 255, 255, 255, false);
      this.time.delayedCall(120, () => {
        this.children.removeAll(true);
        this.startGame(diff);
      });
    });
    btnBg.on('pointerdown', () => card.emit('pointerdown'));
  }

  // ── 게임 시작 ─────────────────────────────────────────────
  startGame(diff) {
    installMinigamePause(this);
    this.diff = diff;
    const W = 800, H = 600;
    this.score = 0; this.combo = 0; this.maxCombo = 0;
    this.perfect = 0; this.good = 0; this.miss = 0;
    this.noteObjects = []; this.startTime = null; this.gameOver = false;
    this.songNotes = generateNotes(diff.noteCount);

    // ── 배경 ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    for (let i = 0; i < 30; i++) {
      const star = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2), 0xffffff, 0.3);
      this.tweens.add({ targets: star, alpha: 0.8, duration: Phaser.Math.Between(500, 1500), yoyo: true, repeat: -1 });
    }

    // ── 레인 ──
    LANES.forEach((lane) => {
      this.add.rectangle(lane.x, H / 2, 90, H, lane.darkColor, 0.15);
      this.add.rectangle(lane.x - 45, H / 2, 2, H, 0x333355, 0.8);
    });
    this.add.rectangle(LANES[3].x + 45, H / 2, 2, H, 0x333355, 0.8);
    this.add.rectangle(W / 2, HIT_Y, W, 3, 0xffffff, 0.3);
    LANES.forEach((lane) => this.add.rectangle(lane.x, HIT_Y, 80, 80, lane.color, 0.1).setStrokeStyle(2, lane.color, 0.5));

    // ── 키 버튼 ──
    this.keyBtns = {};
    LANES.forEach((lane) => {
      const bg = this.add.rectangle(lane.x, HIT_Y + 2, 78, 76, lane.darkColor).setStrokeStyle(3, lane.color);
      const label = this.add.text(lane.x, HIT_Y + 2, lane.key, { fontSize: '20px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
      this.keyBtns[lane.key] = { bg, label };
    });

    // ── HUD ──
    this.add.rectangle(W / 2, 30, W, 60, 0x0d1545, 0.9);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.text(W / 2, 18, `RHYTHM GAME  [${diff.label}]`, { fontSize: '11px', color: diff.labelColor, fontFamily: PF }).setOrigin(0.5, 0);
    this.scoreTxt = this.add.text(W - 20, 10, 'SCORE\n0', { fontSize: '9px', color: '#ffffff', fontFamily: PF, align: 'right' }).setOrigin(1, 0);
    this.comboTxt = this.add.text(W / 2, 50, '', { fontSize: '9px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5, 0);
    this.judgeTxt = this.add.text(W / 2, 420, '', { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5).setAlpha(0);

    // ── 카운트다운 ──
    this.showCountdown();
    this.input.keyboard.on('keydown', this.handleKey, this);
  }

  showCountdown() {
    const W = 800;
    let count = 3;
    const countTxt = this.add.text(W / 2, 280, '3', { fontSize: '60px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.time.addEvent({
      delay: 800, repeat: 2,
      callback: () => {
        count -= 1;
        if (count > 0) {
          this.tweens.add({ targets: countTxt.setText(String(count)), scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
        } else {
          countTxt.setText('GO!').setColor('#00ff88');
          this.tweens.add({ targets: countTxt, alpha: 0, duration: 500, onComplete: () => { countTxt.destroy(); this.startTime = this.time.now; } });
        }
      },
    });
  }

  handleKey(event) {
    if (this.gameOver || !this.startTime) return;
    const key = event.key.toUpperCase();
    const lane = LANES.find((l) => l.key === key);
    if (!lane) return;

    this.keyBtns[key].bg.setFillStyle(lane.color);
    this.time.delayedCall(100, () => this.keyBtns[key].bg.setFillStyle(lane.darkColor));

    const currentTime = this.time.now - this.startTime;
    const laneNotes = this.noteObjects.filter((n) => n.laneKey === key && !n.hit);
    if (laneNotes.length === 0) {
      this.showJudge('MISS', 0xff4444);
      this.miss += 1; this.combo = 0; this.updateHUD();
      return;
    }
    const closest = laneNotes.reduce((a, b) => (Math.abs(a.noteTime - currentTime) < Math.abs(b.noteTime - currentTime) ? a : b));
    const diff = Math.abs(closest.noteTime - currentTime);

    if (diff < this.diff.perfectRange) {
      closest.hit = true; closest.obj.destroy();
      this.showJudge('PERFECT!', 0xFFD700);
      this.score += 300 + this.combo * 10; this.perfect += 1; this.combo += 1;
      this.flashLane(lane);
    } else if (diff < this.diff.goodRange) {
      closest.hit = true; closest.obj.destroy();
      this.showJudge('GOOD', 0x44ff88);
      this.score += 100 + this.combo * 5; this.good += 1; this.combo += 1;
    } else {
      this.showJudge('MISS', 0xff4444);
      this.miss += 1; this.combo = 0;
    }
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.updateHUD();
  }

  flashLane(lane) {
    const flash = this.add.rectangle(lane.x, 300, 90, 600, lane.color, 0.3);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
  }

  showJudge(text, color) {
    const hexColor = color === 0xFFD700 ? '#FFD700' : color === 0x44ff88 ? '#44ff88' : '#ff4444';
    this.judgeTxt.setText(text).setColor(hexColor).setAlpha(1).setScale(1);
    this.tweens.add({ targets: this.judgeTxt, alpha: 0, y: 400, scaleX: 1.3, scaleY: 1.3, duration: 600, ease: 'Power2', onComplete: () => this.judgeTxt.setY(420).setScale(1) });
  }

  updateHUD() {
    this.scoreTxt.setText(`SCORE\n${this.score}`);
    this.comboTxt.setText(this.combo > 1 ? `${this.combo} COMBO!` : '');
  }

  update() {
    if (this.gameOver || !this.startTime) return;
    const currentTime = this.time.now - this.startTime;

    while (this.songNotes.length > 0 && this.songNotes[0].time <= currentTime + (HIT_Y / this.diff.noteSpeed) * 1000) {
      this.spawnNote(this.songNotes.shift());
    }

    this.noteObjects.forEach((note) => {
      if (note.hit) return;
      const y = HIT_Y + ((currentTime - note.noteTime) / 1000) * this.diff.noteSpeed;
      note.obj.setY(y);
      if (y > 580 && !note.hit) {
        note.hit = true; note.obj.destroy();
        this.showJudge('MISS', 0xff4444);
        this.miss += 1; this.combo = 0; this.updateHUD();
      }
    });

    if (this.songNotes.length === 0 && this.noteObjects.every((n) => n.hit) && currentTime > 1000) {
      this.gameOver = true;
      this.time.delayedCall(1000, () => this.endGame());
    }
  }

  spawnNote(noteData) {
    const lane = LANES.find((l) => l.key === noteData.key);
    if (!lane) return;
    const startY = HIT_Y - (noteData.time / 1000) * this.diff.noteSpeed + ((this.time.now - this.startTime) / 1000) * this.diff.noteSpeed;
    const noteGroup = this.add.container(lane.x, startY);
    noteGroup.add([
      this.add.rectangle(3, 3, 72, 28, 0x000000, 0.5),
      this.add.rectangle(0, 0, 72, 28, lane.color),
      this.add.rectangle(-18, -6, 24, 6, 0xffffff, 0.3),
      this.add.text(0, 0, noteData.key, { fontSize: '11px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5),
    ]);
    this.noteObjects.push({ obj: noteGroup, laneKey: noteData.key, noteTime: noteData.time, hit: false });
  }

  endGame() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    this.children.removeAll();
    const W = 800, H = 600;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W / 2 + 3, H / 2 + 3, 620, 420, 0x000000, 0.8);
    this.add.rectangle(W / 2, H / 2, 620, 420, 0x0d1545);
    this.add.rectangle(W / 2, H / 2 - 208, 620, 4, 0xFFD700);
    this.add.rectangle(W / 2, H / 2 + 208, 620, 4, 0xFFD700);
    this.add.rectangle(W / 2 - 308, H / 2, 4, 420, 0xFFD700);
    this.add.rectangle(W / 2 + 308, H / 2, 4, 420, 0xFFD700);
    this.add.text(W / 2, 110, 'RESULT', { fontSize: '20px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 148, `[${this.diff.label}]`, { fontSize: '9px', color: this.diff.labelColor, fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 175, `${this.score}`, { fontSize: '32px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);

    [
      { label: 'PERFECT', value: this.perfect, color: '#FFD700' },
      { label: 'GOOD',    value: this.good,    color: '#44ff88' },
      { label: 'MISS',    value: this.miss,    color: '#ff4466' },
      { label: 'MAX COMBO', value: this.maxCombo, color: '#aaddff' },
    ].forEach((s, i) => {
      this.add.text(W / 2 - 120, 235 + i * 40, s.label, { fontSize: '8px', color: '#888888', fontFamily: PF }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 120, 235 + i * 40, String(s.value), { fontSize: '10px', color: s.color, fontFamily: PF }).setOrigin(1, 0.5);
    });

    const total = this.perfect + this.good + this.miss;
    const acc = total > 0 ? (this.perfect + this.good * 0.5) / total : 0;
    let grade = 'C', gradeColor = '#ff4466';
    if (acc >= 0.95) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (acc >= 0.8) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (acc >= 0.6) { grade = 'B'; gradeColor = '#4499ff'; }

    this.add.text(W / 2 + 200, 270, grade, { fontSize: '60px', color: gradeColor, fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 415, acc >= 0.8 ? 'INT +7    GP +20' : 'INT +3    GP +5', { fontSize: '10px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);

    this.createBtn(200, 490, 'RETRY',      0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(400, 490, '난이도 변경', 0x002200, 0x44ff88, () => { this.children.removeAll(true); this.create(); });
    this.createBtn(610, 490, 'MENU',        0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 178, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 178, 52, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '7px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout',  () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.cameras.main.flash(150, 255, 255, 255, false); this.time.delayedCall(150, cb); });
  }
}
