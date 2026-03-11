// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PIXEL_FONT = '"Press Start 2P"';
const QUESTIONS = [
  { question: 'OSI 7계층에서\n전송 계층 프로토콜은?', options: ['HTTP', 'TCP', 'IP', 'FTP'], answer: 1 },
  { question: '기본키(Primary Key)의\n특징으로 올바른 것은?', options: ['중복 허용', 'NULL 허용', '유일성 보장', '외래키와 동일'], answer: 2 },
  { question: '프로세스와 스레드의\n차이로 올바른 것은?', options: ['스레드는 독립 메모리', '프로세스가 더 가볍다', '스레드는 자원 공유', '프로세스는 스레드 불포함'], answer: 2 },
  { question: 'GROUP BY와 함께\n사용하는 조건절은?', options: ['WHERE', 'HAVING', 'ORDER BY', 'JOIN'], answer: 1 },
  { question: '시간복잡도 O(n log n)인\n정렬 알고리즘은?', options: ['버블 정렬', '선택 정렬', '삽입 정렬', '퀵 정렬'], answer: 3 },
];

export default class QuizScene extends Phaser.Scene {
  constructor() { super({ key: 'QuizScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);
    this.currentIndex = 0; this.score = 0; this.timeLeft = 15; this.answered = false;
    this.questions = Phaser.Utils.Array.Shuffle([...QUESTIONS]);
    const W = 800, H = 600;
    for (let x = 0; x < W; x += 32) for (let y = 0; y < H; y += 32) this.add.rectangle(x + 16, y + 16, 32, 32, ((x + y) / 32) % 2 === 0 ? 0x1a1a2e : 0x16213e);

    this.add.rectangle(W / 2, 35, W, 70, 0x0f3460);
    this.add.rectangle(W / 2, 4, W, 8, 0xFFD700);
    this.add.rectangle(W / 2, 70, W, 4, 0x4488ff);
    this.questionNum = this.add.text(20, 20, 'Q 1/5', { fontSize: '10px', color: '#aaddff', fontFamily: PIXEL_FONT });
    this.scoreText = this.add.text(20, 42, 'SCORE: 0', { fontSize: '8px', color: '#FFD700', fontFamily: PIXEL_FONT });
    this.timerText = this.add.text(W - 20, 20, '15', { fontSize: '20px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(1, 0);
    this.add.text(W - 20, 48, 'SEC', { fontSize: '7px', color: '#888888', fontFamily: PIXEL_FONT }).setOrigin(1, 0);
    this.add.rectangle(W / 2, 62, 680, 8, 0x333333);
    this.timerBar = this.add.rectangle(60, 62, 680, 8, 0x00cc66).setOrigin(0, 0.5);

    this.add.rectangle(W / 2 + 3, 153, 694, 94, 0x000000);
    this.add.rectangle(W / 2, 150, 694, 94, 0x0f3460);
    this.add.rectangle(W / 2, 104, 694, 4, 0x4488ff);
    this.add.rectangle(W / 2, 196, 694, 4, 0x4488ff);
    this.add.rectangle(W / 2 - 345, 150, 4, 94, 0x4488ff);
    this.add.rectangle(W / 2 + 345, 150, 4, 94, 0x4488ff);
    this.questionText = this.add.text(W / 2, 150, '', { fontSize: '13px', color: '#ffffff', fontFamily: PIXEL_FONT, align: 'center', lineSpacing: 10 }).setOrigin(0.5);

    this.optionBtns = [];
    const optLabels = ['A', 'B', 'C', 'D'], optColors = [0x4488ff, 0x44aa44, 0xffaa00, 0xff4466];
    for (let i = 0; i < 4; i += 1) {
      const y = 255 + i * 78;
      this.add.rectangle(W / 2 + 3, y + 3, 680, 62, 0x000000);
      const bg = this.add.rectangle(W / 2, y, 680, 62, 0x0d1117).setInteractive().setStrokeStyle(3, optColors[i]);
      this.add.rectangle(80, y, 44, 44, optColors[i]);
      this.add.text(80, y, optLabels[i], { fontSize: '14px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
      const label = this.add.text(W / 2 + 20, y, '', { fontSize: '11px', color: '#ffffff', fontFamily: PIXEL_FONT, align: 'center', wordWrap: { width: 520 } }).setOrigin(0.5);
      bg.on('pointerover', () => { if (!this.answered) { bg.setFillStyle(0x1a2a4a); this.tweens.add({ targets: bg, scaleX: 1.01, duration: 60 }); } });
      bg.on('pointerout', () => { if (!this.answered) { bg.setFillStyle(0x0d1117); this.tweens.add({ targets: bg, scaleX: 1, duration: 60 }); } });
      bg.on('pointerdown', () => this.checkAnswer(i));
      this.optionBtns.push({ bg, label });
    }

    this.resultText = this.add.text(W / 2, 568, '', { fontSize: '11px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.timerEvent = this.time.addEvent({ delay: 1000, callback: this.tick, callbackScope: this, loop: true });
    this.showQuestion();
  }

  showQuestion() {
    this.answered = false; this.timeLeft = 15; this.resultText.setText('');
    const q = this.questions[this.currentIndex];
    this.questionNum.setText(`Q ${this.currentIndex + 1}/${this.questions.length}`);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.questionText.setText(q.question);
    q.options.forEach((opt, i) => { this.optionBtns[i].label.setText(opt); this.optionBtns[i].bg.setFillStyle(0x0d1117); this.optionBtns[i].bg.setInteractive(); });
    this.timerBar.setScale(1, 1).setFillStyle(0x00cc66);
    this.timerText.setText('15');
  }

  tick() {
    if (this.answered) return;
    this.timeLeft -= 1;
    this.timerText.setText(String(this.timeLeft));
    const ratio = this.timeLeft / 15;
    this.timerBar.setScale(ratio, 1);
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff4444);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    else this.timerBar.setFillStyle(0x00cc66);
    if (this.timeLeft <= 0) this.checkAnswer(-1);
  }

  checkAnswer(selected) {
    if (this.answered) return;
    this.answered = true;
    const correct = this.questions[this.currentIndex].answer;
    const isCorrect = selected === correct;
    this.optionBtns.forEach((btn, i) => {
      btn.bg.disableInteractive();
      if (i === correct) btn.bg.setFillStyle(0x00aa44);
      else if (i === selected) btn.bg.setFillStyle(0xaa2222);
      else btn.bg.setFillStyle(0x222222);
    });

    if (isCorrect) { this.score += 1; this.cameras.main.flash(150, 0, 255, 100, false); this.resultText.setColor('#00ff88').setText('✓ CORRECT!'); }
    else if (selected === -1) this.resultText.setColor('#ff4444').setText('TIME UP!');
    else { this.cameras.main.shake(200, 0.005); this.resultText.setColor('#ff4444').setText('✗ WRONG!'); }

    this.time.delayedCall(1500, () => {
      this.currentIndex += 1;
      if (this.currentIndex < this.questions.length) this.showQuestion();
      else this.endGame();
    });
  }

  endGame() {
    this.timerEvent.remove();
    this.children.removeAll();
    const W = 800, H = 600;
    for (let x = 0; x < W; x += 32) for (let y = 0; y < H; y += 32) this.add.rectangle(x + 16, y + 16, 32, 32, ((x + y) / 32) % 2 === 0 ? 0x1a1a2e : 0x16213e);
    this.add.rectangle(W / 2, 4, W, 8, 0xFFD700);
    const total = this.questions.length, ratio = this.score / total;
    let grade = 'TRY AGAIN', color = '#ff8844', statMsg = 'INT +2    STRESS +5';
    if (ratio >= 0.8) { grade = 'PERFECT!'; color = '#FFD700'; statMsg = 'INT +10    GP +30'; }
    else if (ratio >= 0.6) { grade = 'GOOD!'; color = '#00ff88'; statMsg = 'INT +5    GP +15'; }

    this.add.rectangle(W / 2 + 3, 223, 604, 304, 0x000000);
    this.add.rectangle(W / 2, 220, 604, 304, 0x0f3460);
    this.add.rectangle(W / 2, 69, 604, 4, 0xFFD700);
    this.add.rectangle(W / 2, 371, 604, 4, 0xFFD700);
    this.add.rectangle(W / 2 - 300, 220, 4, 304, 0xFFD700);
    this.add.rectangle(W / 2 + 300, 220, 4, 304, 0xFFD700);
    this.add.text(W / 2, 120, 'RESULT', { fontSize: '24px', color: '#FFD700', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 175, `${this.score} / ${total}`, { fontSize: '36px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 235, grade, { fontSize: '20px', color, fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.add.text(W / 2, 290, statMsg, { fontSize: '12px', color: '#aaddff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    this.createPixelBtn(270, 350, 'RETRY', 0x2e5f9f, 0x4488ff, () => this.scene.restart());
    this.createPixelBtn(530, 350, 'MENU', 0x3d1f0f, 0xffaa44, () => this.scene.start('MenuScene'));
  }

  createPixelBtn(x, y, label, bg, border, callback) {
    this.add.rectangle(x + 3, y + 3, 190, 50, 0x000000);
    const btn = this.add.rectangle(x, y, 190, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '11px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => { this.cameras.main.flash(150, 255, 255, 255, false); this.time.delayedCall(150, callback); });
  }
}
