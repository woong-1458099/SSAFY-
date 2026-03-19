// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const SONGS = [{ title: 'SSAFY RHYTHM', notes: [{ key: 'A', time: 1000 }, { key: 'W', time: 1500 }, { key: 'J', time: 2000 }, { key: 'I', time: 2500 }, { key: 'A', time: 3000 }, { key: 'J', time: 3500 }, { key: 'W', time: 4000 }, { key: 'I', time: 4500 }, { key: 'A', time: 5000 }, { key: 'W', time: 5000 }, { key: 'J', time: 5500 }, { key: 'I', time: 6000 }, { key: 'A', time: 6500 }, { key: 'W', time: 7000 }, { key: 'J', time: 7500 }, { key: 'I', time: 7500 }, { key: 'A', time: 8000 }, { key: 'W', time: 8500 }, { key: 'J', time: 9000 }, { key: 'I', time: 9500 }] }];
const LANES = [{ key: 'A', x: 200, color: 0xff4466, darkColor: 0x881133 }, { key: 'W', x: 310, color: 0xffaa00, darkColor: 0x886600 }, { key: 'J', x: 420, color: 0x44ff88, darkColor: 0x228844 }, { key: 'I', x: 530, color: 0x4499ff, darkColor: 0x224488 }];
const HIT_Y = 490;

const DIFFICULTY_SETTINGS = {
  Easy: { speed: 250, perfect: 60, good: 100, reward: 'INT +5  GP +10' },
  Normal: { speed: 350, perfect: 50, good: 90, reward: 'INT +7  GP +20' },
  Hard: { speed: 450, perfect: 40, good: 70, reward: 'INT +10 GP +30' }
};

export default class RhythmScene extends Phaser.Scene {
  private difficulty: 'Easy' | 'Normal' | 'Hard' = 'Normal';
  private config = DIFFICULTY_SETTINGS.Normal;

  constructor() { super({ key: 'RhythmScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);
    const W = 800, H = 600;
    
    // Initial State
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.perfect = 0; this.good = 0; this.miss = 0; 
    this.noteObjects = []; this.startTime = null; this.gameOver = false; this.songNotes = [];

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    for (let i = 0; i < 30; i += 1) {
      const star = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2), 0xffffff, 0.3);
      this.tweens.add({ targets: star, alpha: 0.8, duration: Phaser.Math.Between(500, 1500), yoyo: true, repeat: -1 });
    }

    this.showDifficultySelection();
  }

  showDifficultySelection() {
    const W = 800, H = 600;
    this.selectionRoot = this.add.container(0, 0);
    
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8);
    const panel = this.add.rectangle(W / 2, H / 2, 500, 360, 0x0d1545).setStrokeStyle(4, 0xffd700);
    const title = this.add.text(W / 2, H / 2 - 140, 'SELECT DIFFICULTY', { fontSize: '20px', color: '#ffd700', fontFamily: PF }).setOrigin(0.5);
    
    this.selectionRoot.add([overlay, panel, title]);

    ['Easy', 'Normal', 'Hard'].forEach((level, i) => {
      const y = H / 2 - 40 + i * 70;
      const btn = this.add.rectangle(W / 2, y, 300, 50, 0x1a2a4a).setStrokeStyle(2, 0x44ff88).setInteractive({ useHandCursor: true });
      const txt = this.add.text(W / 2, y, level, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
      
      btn.on('pointerover', () => btn.setFillStyle(0x2a3a6a));
      btn.on('pointerout', () => btn.setFillStyle(0x1a2a4a));
      btn.on('pointerdown', () => this.selectDifficulty(level));
      
      this.selectionRoot.add([btn, txt]);
    });
  }

  selectDifficulty(level) {
    this.difficulty = level;
    this.config = DIFFICULTY_SETTINGS[level];
    this.songNotes = [...SONGS[0].notes];
    this.selectionRoot.destroy();
    this.setupGameUI();
  }

  setupGameUI() {
    const W = 800, H = 600;
    LANES.forEach((lane) => { this.add.rectangle(lane.x, H / 2, 90, H, lane.darkColor, 0.15); this.add.rectangle(lane.x - 45, H / 2, 2, H, 0x333355, 0.8); });
    this.add.rectangle(LANES[3].x + 45, H / 2, 2, H, 0x333355, 0.8);
    this.add.rectangle(W / 2, HIT_Y, W, 3, 0xffffff, 0.3);
    LANES.forEach((lane) => this.add.rectangle(lane.x, HIT_Y, 80, 80, lane.color, 0.1).setStrokeStyle(2, lane.color, 0.5));
    
    this.keyBtns = {};
    LANES.forEach((lane) => {
      const bg = this.add.rectangle(lane.x, HIT_Y + 2, 78, 76, lane.darkColor).setStrokeStyle(3, lane.color);
      const label = this.add.text(lane.x, HIT_Y + 2, lane.key, { fontSize: '20px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
      this.keyBtns[lane.key] = { bg, label };
    });

    this.add.rectangle(W / 2, 30, W, 60, 0x0d1545, 0.9); this.add.rectangle(W / 2, 4, W, 6, 0xFFD700);
    this.add.text(W / 2, 18, `${SONGS[0].title} (${this.difficulty})`, { fontSize: '12px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5, 0);
    
    this.scoreTxt = this.add.text(W - 20, 10, 'SCORE\n0', { fontSize: '9px', color: '#ffffff', fontFamily: PF, align: 'right' }).setOrigin(1, 0);
    this.comboTxt = this.add.text(W / 2, 50, '', { fontSize: '9px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5, 0);
    this.judgeTxt = this.add.text(W / 2, 420, '', { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5).setAlpha(0);
    
    this.showCountdown();
    this.input.keyboard.on('keydown', this.handleKey, this);

    // 씬 종료 시 정리
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  shutdown() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    this.noteObjects = [];
  }

  showCountdown() {
    const W = 800; let count = 3;
    const countTxt = this.add.text(W / 2, 280, '3', { fontSize: '60px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.time.addEvent({
      delay: 800, repeat: 2,
      callback: () => {
        count -= 1;
        if (count > 0) this.tweens.add({ targets: countTxt.setText(String(count)), scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
        else {
          countTxt.setText('GO!').setColor('#00ff88');
          this.tweens.add({ targets: countTxt, alpha: 0, duration: 500, onComplete: () => { countTxt.destroy(); this.startGame(); } });
        }
      },
    });
  }

  startGame() { this.startTime = this.time.now; }

  handleKey(event) {
    if (this.gameOver || !this.startTime) return;
    const key = event.key.toUpperCase();
    const lane = LANES.find((l) => l.key === key);
    if (!lane) return;
    this.keyBtns[key].bg.setFillStyle(lane.color);
    this.time.delayedCall(100, () => this.keyBtns[key].bg.setFillStyle(lane.darkColor));
    
    const currentTime = this.time.now - this.startTime;
    const laneNotes = this.noteObjects.filter((n) => n.laneKey === key && !n.hit);
    if (laneNotes.length === 0) { this.showJudge('MISS', 0xff4444); this.miss += 1; this.combo = 0; this.updateHUD(); return; }
    
    const closest = laneNotes.reduce((a, b) => (Math.abs(a.noteTime - currentTime) < Math.abs(b.noteTime - currentTime) ? a : b));
    const diff = Math.abs(closest.noteTime - currentTime);
    
    if (diff < this.config.perfect) { closest.hit = true; closest.obj.destroy(); this.showJudge('PERFECT!', 0xFFD700); this.score += 300 + this.combo * 10; this.perfect += 1; this.combo += 1; this.flashLane(lane); }
    else if (diff < this.config.good) { closest.hit = true; closest.obj.destroy(); this.showJudge('GOOD', 0x44ff88); this.score += 100 + this.combo * 5; this.good += 1; this.combo += 1; }
    else { this.showJudge('MISS', 0xff4444); this.miss += 1; this.combo = 0; }
    
    this.maxCombo = Math.max(this.maxCombo, this.combo); this.updateHUD();
  }

  flashLane(lane) {
    const flash = this.add.rectangle(lane.x, 300, 90, 600, lane.color, 0.3);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
  }

  showJudge(text, color) {
    this.judgeTxt.setText(text).setColor(color === 0xFFD700 ? '#FFD700' : color === 0x44ff88 ? '#44ff88' : '#ff4444').setAlpha(1).setScale(1);
    this.tweens.add({ targets: this.judgeTxt, alpha: 0, y: 400, scaleX: 1.3, scaleY: 1.3, duration: 600, ease: 'Power2', onComplete: () => this.judgeTxt.setY(420).setScale(1) });
  }

  updateHUD() { this.scoreTxt.setText(`SCORE\n${this.score}`); this.comboTxt.setText(this.combo > 1 ? `${this.combo} COMBO!` : ''); }

  update() {
    if (this.gameOver || !this.startTime) return;
    const currentTime = this.time.now - this.startTime;
    while (this.songNotes.length > 0 && this.songNotes[0].time <= currentTime + (HIT_Y / this.config.speed) * 1000) this.spawnNote(this.songNotes.shift());
    
    this.noteObjects.forEach((note) => {
      if (note.hit) return;
      const y = HIT_Y + ((currentTime - note.noteTime) / 1000) * this.config.speed;
      note.obj.setY(y);
      if (y > 580 && !note.hit) { note.hit = true; note.obj.destroy(); this.showJudge('MISS', 0xff4444); this.miss += 1; this.combo = 0; this.updateHUD(); }
    });
    
    if (this.songNotes.length === 0 && this.noteObjects.every((n) => n.hit) && currentTime > 1000) { this.gameOver = true; this.time.delayedCall(1000, () => this.endGame()); }
  }

  spawnNote(noteData) {
    const lane = LANES.find((l) => l.key === noteData.key); if (!lane) return;
    const startY = HIT_Y - (noteData.time / 1000) * this.config.speed + ((this.time.now - this.startTime) / 1000) * this.config.speed;
    const noteGroup = this.add.container(lane.x, startY);
    noteGroup.add([this.add.rectangle(3, 3, 72, 28, 0x000000, 0.5), this.add.rectangle(0, 0, 72, 28, lane.color), this.add.rectangle(-18, -6, 24, 6, 0xffffff, 0.3), this.add.text(0, 0, noteData.key, { fontSize: '11px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5)]);
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
    this.add.text(W / 2, 110, `RESULT (${this.difficulty})`, { fontSize: '20px', color: '#FFD700', fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 175, `${this.score}`, { fontSize: '32px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    [{ label: 'PERFECT', value: this.perfect, color: '#FFD700' }, { label: 'GOOD', value: this.good, color: '#44ff88' }, { label: 'MISS', value: this.miss, color: '#ff4466' }, { label: 'MAX COMBO', value: this.maxCombo, color: '#aaddff' }].forEach((s, i) => {
      this.add.text(W / 2 - 120, 240 + i * 40, s.label, { fontSize: '9px', color: '#888888', fontFamily: PF }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 120, 240 + i * 40, String(s.value), { fontSize: '11px', color: s.color, fontFamily: PF }).setOrigin(1, 0.5);
    });
    const total = this.perfect + this.good + this.miss, acc = total > 0 ? (this.perfect + this.good * 0.5) / total : 0;
    let grade = 'C', gradeColor = '#ff4466';
    if (acc >= 0.95) { grade = 'S'; gradeColor = '#FFD700'; }
    else if (acc >= 0.8) { grade = 'A'; gradeColor = '#00ff88'; }
    else if (acc >= 0.6) { grade = 'B'; gradeColor = '#4499ff'; }
    this.add.text(W / 2 + 200, 270, grade, { fontSize: '60px', color: gradeColor, fontFamily: PF }).setOrigin(0.5);
    this.add.text(W / 2, 415, this.config.reward, { fontSize: '10px', color: '#aaddff', fontFamily: PF }).setOrigin(0.5);
    this.createBtn(270, 490, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 490, 'MENU', 0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 52, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 52, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border)); btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.cameras.main.flash(150, 255, 255, 255, false); this.time.delayedCall(150, cb); });
  }
}
