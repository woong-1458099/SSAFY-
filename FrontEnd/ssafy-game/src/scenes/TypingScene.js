import Phaser from 'phaser';

const PF = '"Press Start 2P"';

const CODE_CHALLENGES = [
  { code: 'for i in range(n): print(i)', desc: 'PRINT 0 TO N-1' },
  { code: 'def solution(arr): return sorted(arr)', desc: 'SORT AND RETURN ARRAY' },
  { code: 'if n % 2 == 0: return True', desc: 'CHECK IF N IS EVEN' },
  { code: 'stack = []; stack.append(x)', desc: 'PUSH ELEMENT TO STACK' },
  { code: 'return max(dp[i] for i in range(n))', desc: 'GET MAX VALUE FROM DP' },
  { code: 'graph[a].append(b)', desc: 'ADD EDGE TO ADJACENCY LIST' },
  { code: 'while left <= right: mid = (left+right)//2', desc: 'BINARY SEARCH BASE' },
];

export default class TypingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingScene' });
  }

  create() {
    const W = 800, H = 600;

    this.typedText = '';
    this.timeLeft = 20;
    this.answered = false;
    this.startTime = null;
    this.challenge = Phaser.Math.RND.pick(CODE_CHALLENGES);

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 그리드
    for (let x = 0; x < W; x += 40) {
      this.add.rectangle(x, H/2, 1, H, 0x112233, 0.4);
    }
    for (let y = 0; y < H; y += 40) {
      this.add.rectangle(W/2, y, W, 1, 0x112233, 0.4);
    }

    // 별
    for (let i = 0; i < 25; i++) {
      this.add.rectangle(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        Phaser.Math.Between(1, 2), Phaser.Math.Between(1, 2),
        0xffffff, 0.3
      );
    }

    // 상단 HUD
    this.add.rectangle(W/2, 25, W, 50, 0x0d1545, 0.95);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W/2, 50, W, 3, 0x44ff88);

    this.add.text(W/2, 10, 'CODE TYPING', {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    this.timerTxt = this.add.text(W - 20, 12, 'TIME: 20', {
      fontSize: '9px', color: '#44ff88', fontFamily: PF
    }).setOrigin(1, 0);

    // 타이머 바
    this.add.rectangle(W/2, 47, W - 40, 5, 0x333355);
    this.timerBar = this.add.rectangle(20, 47, W - 40, 5, 0x44ff88).setOrigin(0, 0.5);

    // 문제 설명 박스
    this.add.rectangle(W/2 + 2, 112, 724, 44, 0x000000, 0.6);
    this.add.rectangle(W/2, 110, 724, 44, 0x0d2a1a);
    this.add.rectangle(W/2, 89, 724, 3, 0x44ff88);
    this.add.rectangle(W/2, 131, 724, 3, 0x44ff88);

    this.add.text(W/2, 110, '💡  ' + this.challenge.desc, {
      fontSize: '11px', color: '#44ff88', fontFamily: PF
    }).setOrigin(0.5);

    // 목표 코드 박스
    this.add.rectangle(W/2 + 2, 212, 724, 74, 0x000000, 0.6);
    this.add.rectangle(W/2, 210, 724, 74, 0x0d1117);
    this.add.rectangle(W/2, 174, 724, 3, 0xFFD700);
    this.add.rectangle(W/2, 246, 724, 3, 0xFFD700);
    this.add.rectangle(W/2 - 360, 210, 3, 74, 0xFFD700);
    this.add.rectangle(W/2 + 360, 210, 3, 74, 0xFFD700);

    this.add.text(60, 195, 'TARGET', {
      fontSize: '7px', color: '#888888', fontFamily: PF
    });

    this.add.text(W/2, 215, this.challenge.code, {
      fontSize: '18px', color: '#FFD700',
      fontFamily: 'monospace', align: 'center'
    }).setOrigin(0.5);

    // 입력창 박스
    this.add.rectangle(W/2 + 2, 322, 724, 74, 0x000000, 0.6);
    this.inputBox = this.add.rectangle(W/2, 320, 724, 74, 0x0d1117)
      .setStrokeStyle(3, 0x333355);
    this.add.rectangle(W/2 - 360, 320, 3, 74, 0x333355);
    this.add.rectangle(W/2 + 360, 320, 3, 74, 0x333355);

    this.add.text(60, 285, 'INPUT', {
      fontSize: '7px', color: '#888888', fontFamily: PF
    });

    this.inputDisplay = this.add.text(66, 308, '', {
      fontSize: '18px', color: '#ffffff',
      fontFamily: 'monospace'
    });

    // 커서
    this.cursor = this.add.rectangle(72, 320, 3, 30, 0xffffff);
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => this.cursor.setVisible(!this.cursor.visible)
    });

    // 진행도 바
    this.add.text(60, 415, 'PROGRESS', {
      fontSize: '7px', color: '#888888', fontFamily: PF
    });
    this.add.rectangle(W/2, 435, 700, 14, 0x333355);
    this.progressBar = this.add.rectangle(52, 435, 0, 14, 0x44ff88).setOrigin(0, 0.5);

    // 글자별 정확도 표시
    this.charDisplay = this.add.text(W/2, 470, '', {
      fontSize: '14px', color: '#ffffff',
      fontFamily: 'monospace', align: 'center'
    }).setOrigin(0.5);

    // 결과
    this.resultTxt = this.add.text(W/2, 520, '', {
      fontSize: '13px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.statTxt = this.add.text(W/2, 550, '', {
      fontSize: '10px', color: '#aaddff', fontFamily: PF
    }).setOrigin(0.5);

    // 힌트
    this.hintTxt = this.add.text(W/2, 575, 'TYPE THE CODE ABOVE!', {
      fontSize: '8px', color: '#445566', fontFamily: PF
    }).setOrigin(0.5);

    // 키 입력
    this.input.keyboard.on('keydown', this.handleKey, this);

    // 타이머
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: this.tick, callbackScope: this
    });
  }

  handleKey(event) {
    if (this.answered) return;
    if (!this.startTime) this.startTime = Date.now();

    if (event.key === 'Backspace') {
      this.typedText = this.typedText.slice(0, -1);
    } else if (event.key === 'Enter') {
      if (this.typedText === this.challenge.code) this.endGame(true);
      return;
    } else if (event.key.length === 1) {
      this.typedText += event.key;
    }

    this.updateDisplay();

    if (this.typedText === this.challenge.code) this.endGame(true);
  }

  updateDisplay() {
    const target = this.challenge.code;
    const typed = this.typedText;

    this.inputDisplay.setText(typed);

    // 커서 위치
    const charW = 10.8;
    this.cursor.setX(72 + typed.length * charW);

    // 진행 바
    const progress = Math.min(typed.length / target.length, 1);
    this.progressBar.setScale(progress * 6.48, 1);

    // 정확도 색상
    const correctCount = typed.split('').filter((c, i) => c === target[i]).length;
    const acc = typed.length > 0 ? correctCount / typed.length : 1;

    if (acc > 0.8) {
      this.progressBar.setFillStyle(0x44ff88);
      this.inputBox.setStrokeStyle(3, 0x44ff88);
    } else if (acc > 0.5) {
      this.progressBar.setFillStyle(0xffaa00);
      this.inputBox.setStrokeStyle(3, 0xffaa00);
    } else {
      this.progressBar.setFillStyle(0xff4466);
      this.inputBox.setStrokeStyle(3, 0xff4466);
    }

    // 글자별 O/X 표시
    let charStatus = '';
    for (let i = 0; i < typed.length; i++) {
      charStatus += typed[i] === target[i] ? '▪' : '✕';
    }
    this.charDisplay.setText(charStatus);
  }

  tick() {
    if (this.answered) return;
    this.timeLeft--;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);

    const ratio = this.timeLeft / 20;
    this.timerBar.setScale(ratio, 1);
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff4466);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    else this.timerBar.setFillStyle(0x44ff88);

    if (this.timeLeft <= 0) this.endGame(false);
  }

  endGame(success) {
    if (this.answered) return;
    this.answered = true;
    this.timerEvent.remove();
    this.input.keyboard.off('keydown', this.handleKey, this);
    this.cursor.setVisible(false);
    this.hintTxt.setVisible(false);

    let msg, color, stat;

    if (success) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (elapsed < 7) {
        msg = '⚡ PERFECT! SPEED CODER!';
        color = '#FFD700';
        stat = 'INT +7    GP +20';
      } else if (elapsed < 14) {
        msg = '✅ SUCCESS!';
        color = '#44ff88';
        stat = 'INT +5    GP +10';
      } else {
        msg = '👍 COMPLETE!';
        color = '#aaddff';
        stat = 'INT +3    GP +5';
      }
      this.cameras.main.flash(200, 0, 255, 100, false);
    } else {
      msg = '⏰ TIME UP...';
      color = '#ff4466';
      stat = 'STRESS +5';
      this.cameras.main.shake(300, 0.008);
    }

    this.resultTxt.setColor(color).setText(msg);
    this.statTxt.setText(stat);

    this.time.delayedCall(600, () => {
      this.createBtn(270, 575, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
      this.createBtn(530, 575, 'MENU', 0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
    });
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 190, 44, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 190, 44, bg)
      .setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, {
      fontSize: '11px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(150, 255, 255, 255, false);
      this.time.delayedCall(150, cb);
    });
  }
}