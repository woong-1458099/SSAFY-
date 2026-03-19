// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

// 프로그래밍 관련 단어들
const WORDS = [
  // 짧은 단어 (쉬움)
  'API', 'CSS', 'DOM', 'Git', 'npm', 'SQL', 'JWT', 'AWS',
  // 중간 단어
  'React', 'Redux', 'Spring', 'Docker', 'Linux', 'MySQL', 'Vue.js', 'axios',
  'async', 'await', 'fetch', 'props', 'state', 'hooks', 'query', 'merge',
  // 긴 단어 (어려움)
  'useState', 'useEffect', 'component', 'function', 'variable', 'callback',
  'promise', 'database', 'frontend', 'backend', 'fullstack', 'deploy',
  'container', 'kubernetes', 'microservice', 'algorithm'
];

export default class TypingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.score = 0;
    this.lives = 5;
    this.gameOver = false;
    this.typedText = '';
    this.fallingWords = [];
    this.wordSpeed = 0.8;
    this.spawnInterval = 2000;
    this.elapsedTime = 0;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);

    // 그리드 패턴
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a2a3a, 0.3);
    for (let x = 0; x < W; x += 50) grid.lineBetween(x, 80, x, H - 60);
    for (let y = 80; y < H - 60; y += 50) grid.lineBetween(0, y, W, y);

    // 상단 UI
    this.add.rectangle(W / 2, 40, W, 80, 0x0d1545, 0.95);
    this.add.rectangle(W / 2, 0, W, 4, 0x44ff88);
    this.add.rectangle(W / 2, 80, W, 3, 0x44ff88);

    this.add.text(W / 2, 18, '⌨️ 타이핑 디펜스', {
      fontSize: '18px', color: '#44ff88', fontFamily: PF
    }).setOrigin(0.5);

    this.scoreTxt = this.add.text(30, 50, 'SCORE: 0', {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    });

    // 목숨 표시
    this.livesContainer = this.add.container(W - 30, 50);
    this.updateLivesDisplay();

    // 하단 입력 영역
    this.add.rectangle(W / 2, H - 30, W, 60, 0x0d1545, 0.95);
    this.add.rectangle(W / 2, H - 60, W, 3, 0xFFD700);

    // 데드라인 (빨간 선)
    this.add.rectangle(W / 2, H - 63, W, 4, 0xff4444, 0.8);
    this.add.text(30, H - 75, '⚠️ DEADLINE', {
      fontSize: '8px', color: '#ff4444', fontFamily: PF
    });

    // 입력창
    this.add.rectangle(W / 2, H - 30, 400, 40, 0x1a2a3a).setStrokeStyle(3, 0xFFD700);
    this.inputDisplay = this.add.text(W / 2, H - 30, '', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // 커서 깜빡임
    this.cursor = this.add.text(W / 2, H - 30, '_', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.time.addEvent({
      delay: 400, loop: true,
      callback: () => this.cursor.setVisible(!this.cursor.visible)
    });

    // 안내 문구
    this.hintTxt = this.add.text(W / 2, H - 8, '떨어지는 단어를 입력하세요!', {
      fontSize: '9px', color: '#668888', fontFamily: PF
    }).setOrigin(0.5);

    // 키보드 입력
    this.input.keyboard.on('keydown', this.handleKey, this);

    // 단어 생성 타이머
    this.spawnEvent = this.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnWord,
      callbackScope: this,
      loop: true
    });

    // 첫 단어 바로 생성
    this.time.delayedCall(500, () => this.spawnWord());

    // 난이도 증가 타이머
    this.time.addEvent({
      delay: 5000,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true
    });
  }

  updateLivesDisplay() {
    this.livesContainer.removeAll(true);
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(-i * 22, 0, i < this.lives ? '❤️' : '🖤', {
        fontSize: '14px'
      }).setOrigin(1, 0.5);
      this.livesContainer.add(heart);
    }
  }

  spawnWord() {
    if (this.gameOver) return;

    // 난이도에 따른 단어 선택
    const difficulty = Math.min(this.elapsedTime / 30000, 1); // 30초에 걸쳐 최대 난이도
    let wordPool;
    if (difficulty < 0.3) {
      wordPool = WORDS.filter(w => w.length <= 5);
    } else if (difficulty < 0.7) {
      wordPool = WORDS.filter(w => w.length <= 8);
    } else {
      wordPool = WORDS;
    }

    const word = Phaser.Math.RND.pick(wordPool);
    const x = Phaser.Math.Between(100, W - 100);

    const container = this.add.container(x, -30);

    // 단어 배경
    const bg = this.add.rectangle(0, 0, word.length * 14 + 20, 32, 0x223344, 0.9);
    bg.setStrokeStyle(2, 0x44ff88);

    // 단어 텍스트
    const text = this.add.text(0, 0, word, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setData('word', word);
    container.setData('bg', bg);
    container.setData('text', text);
    container.setData('matched', '');

    this.fallingWords.push(container);
  }

  increaseDifficulty() {
    if (this.gameOver) return;

    this.elapsedTime += 5000;
    this.wordSpeed = Math.min(this.wordSpeed + 0.15, 2.5);

    // 생성 간격 줄이기
    if (this.spawnInterval > 800) {
      this.spawnInterval -= 150;
      this.spawnEvent.remove();
      this.spawnEvent = this.time.addEvent({
        delay: this.spawnInterval,
        callback: this.spawnWord,
        callbackScope: this,
        loop: true
      });
    }
  }

  handleKey(event) {
    if (this.gameOver) return;

    if (event.key === 'Backspace') {
      this.typedText = this.typedText.slice(0, -1);
    } else if (event.key === 'Escape') {
      this.typedText = '';
    } else if (event.key.length === 1 && event.key.match(/[a-zA-Z0-9.]/)) {
      this.typedText += event.key;
    }

    this.inputDisplay.setText(this.typedText);
    this.updateCursorPosition();
    this.checkMatches();
  }

  updateCursorPosition() {
    const textWidth = this.typedText.length * 10;
    this.cursor.setX(W / 2 + textWidth / 2 + 5);
  }

  checkMatches() {
    const typed = this.typedText.toLowerCase();

    for (let i = this.fallingWords.length - 1; i >= 0; i--) {
      const container = this.fallingWords[i];
      const word = container.getData('word').toLowerCase();
      const bg = container.getData('bg');
      const text = container.getData('text');

      // 완전 일치
      if (typed === word) {
        this.destroyWord(container, i);
        this.typedText = '';
        this.inputDisplay.setText('');
        this.updateCursorPosition();
        return;
      }

      // 부분 일치 표시
      if (word.startsWith(typed) && typed.length > 0) {
        bg.setStrokeStyle(3, 0xFFD700);
        // 일치 부분 하이라이트
        const matchedPart = container.getData('word').substring(0, typed.length);
        const remainingPart = container.getData('word').substring(typed.length);
        text.setText(matchedPart);
        text.setColor('#FFD700');

        // 나머지 부분 표시
        if (!container.getData('remainText')) {
          const remainText = this.add.text(typed.length * 7, 0, remainingPart, {
            fontSize: '14px', color: '#888888', fontFamily: 'monospace'
          }).setOrigin(0, 0.5);
          container.add(remainText);
          container.setData('remainText', remainText);
        } else {
          container.getData('remainText').setText(remainingPart);
          container.getData('remainText').setX(typed.length * 7);
        }
      } else {
        bg.setStrokeStyle(2, 0x44ff88);
        text.setText(container.getData('word'));
        text.setColor('#ffffff');
        if (container.getData('remainText')) {
          container.getData('remainText').setText('');
        }
      }
    }
  }

  destroyWord(container, index) {
    // 점수 계산 (단어 길이 * 10)
    const word = container.getData('word');
    const points = word.length * 10;
    this.score += points;
    this.scoreTxt.setText(`SCORE: ${this.score}`);

    // 이펙트
    const exp = this.add.text(container.x, container.y, `+${points}`, {
      fontSize: '16px', color: '#44ff88', fontFamily: PF
    }).setOrigin(0.5);
    this.tweens.add({
      targets: exp,
      y: container.y - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => exp.destroy()
    });

    // 파티클 효과
    for (let i = 0; i < 8; i++) {
      const particle = this.add.rectangle(
        container.x + Phaser.Math.Between(-20, 20),
        container.y,
        4, 4, 0x44ff88
      );
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-60, 60),
        y: particle.y + Phaser.Math.Between(-40, 40),
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }

    container.destroy();
    this.fallingWords.splice(index, 1);

    this.cameras.main.shake(50, 0.003);
  }

  update(time, delta) {
    if (this.gameOver) return;

    // 단어 이동
    for (let i = this.fallingWords.length - 1; i >= 0; i--) {
      const container = this.fallingWords[i];
      container.y += this.wordSpeed;

      // 데드라인 도달
      if (container.y > H - 80) {
        container.destroy();
        this.fallingWords.splice(i, 1);
        this.loseLife();
      }
    }
  }

  loseLife() {
    this.lives--;
    this.updateLivesDisplay();

    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(150, 100, 0, 0);

    if (this.lives <= 0) {
      this.endGame();
    }
  }

  endGame() {
    this.gameOver = true;
    this.spawnEvent.remove();
    this.input.keyboard.off('keydown', this.handleKey, this);

    // 남은 단어 제거
    this.fallingWords.forEach(w => w.destroy());
    this.fallingWords = [];

    this.time.delayedCall(500, () => this.showResult());
  }

  showResult() {
    this.children.removeAll();

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.add.rectangle(W / 2, 0, W, 4, 0x44ff88);

    // 결과 박스
    this.add.rectangle(W / 2, H / 2, 500, 380, 0x0d1545).setStrokeStyle(4, 0x44ff88);

    this.add.text(W / 2, 150, '⌨️ 게임 종료', {
      fontSize: '24px', color: '#44ff88', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 220, `${this.score}`, {
      fontSize: '56px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 등급 계산
    let grade, gradeColor, msg, reward;
    if (this.score >= 500) {
      grade = 'S'; gradeColor = '#FFD700';
      msg = '🏆 타이핑 마스터!';
      reward = '지능 +10, GP +30';
    } else if (this.score >= 300) {
      grade = 'A'; gradeColor = '#44ff88';
      msg = '⚡ 훌륭해요!';
      reward = '지능 +7, GP +20';
    } else if (this.score >= 150) {
      grade = 'B'; gradeColor = '#4499ff';
      msg = '👍 좋아요!';
      reward = '지능 +5, GP +10';
    } else {
      grade = 'C'; gradeColor = '#ff8844';
      msg = '💪 연습이 필요해요';
      reward = '지능 +2, 스트레스 +5';
    }

    this.add.text(W / 2 + 100, 220, grade, {
      fontSize: '48px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, msg, {
      fontSize: '14px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 340, `보상: ${reward}`, {
      fontSize: '12px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(W / 2 - 120, 420, '다시하기', 0x004422, 0x44ff88, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 420, '메뉴', 0x222244, 0x6666aa, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '12px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(100, 255, 255, 255, false);
      this.time.delayedCall(100, cb);
    });
  }

  shutdown() {
    this.input.keyboard.off('keydown', this.handleKey, this);
    if (this.spawnEvent) this.spawnEvent.remove();
    this.fallingWords = [];
  }
}
