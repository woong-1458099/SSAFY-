import Phaser from 'phaser';

const PF = '"Press Start 2P"';

const CHALLENGES = [
  {
    desc: 'BUBBLE SORT',
    lines: [
      'for i in range(n):',
      '  for j in range(n-i-1):',
      '    if arr[j] > arr[j+1]:',
      '      arr[j], arr[j+1] = arr[j+1], arr[j]',
    ]
  },
  {
    desc: 'FIBONACCI SEQUENCE',
    lines: [
      'def fib(n):',
      '  if n <= 1: return n',
      '  a, b = 0, 1',
      '  for _ in range(n-1):',
      '    a, b = b, a+b',
      '  return b',
    ]
  },
  {
    desc: 'BINARY SEARCH',
    lines: [
      'def binary_search(arr, target):',
      '  left, right = 0, len(arr)-1',
      '  while left <= right:',
      '    mid = (left + right) // 2',
      '    if arr[mid] == target: return mid',
      '    elif arr[mid] < target: left = mid + 1',
      '    else: right = mid - 1',
      '  return -1',
    ]
  }
];

export default class DragScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DragScene' });
  }

  create() {
    const W = 800, H = 600;

    this.answered = false;
    this.timeLeft = 60;
    this.blocks = [];
    this.challenge = Phaser.Math.RND.pick(CHALLENGES);
    this.correctOrder = [...this.challenge.lines];
    this.shuffled = Phaser.Utils.Array.Shuffle([...this.challenge.lines]);

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
    this.add.rectangle(W/2, 50, W, 3, 0xcc55ff);

    this.add.text(W/2, 10, 'CODE SORT', {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    this.timerTxt = this.add.text(W - 20, 12, 'TIME: 60', {
      fontSize: '9px', color: '#cc55ff', fontFamily: PF
    }).setOrigin(1, 0);

    // 타이머 바
    this.add.rectangle(W/2, 47, W - 40, 5, 0x333355);
    this.timerBar = this.add.rectangle(20, 47, W - 40, 5, 0xcc55ff).setOrigin(0, 0.5);

    // 문제 설명
    this.add.rectangle(W/2 + 2, 82, 724, 34, 0x000000, 0.6);
    this.add.rectangle(W/2, 80, 724, 34, 0x1a0033);
    this.add.rectangle(W/2, 64, 724, 3, 0xcc55ff);
    this.add.rectangle(W/2, 97, 724, 3, 0xcc55ff);

    this.add.text(W/2, 80, '🧩  ' + this.challenge.desc, {
      fontSize: '10px', color: '#cc55ff', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 114, 'DRAG BLOCKS TO CORRECT ORDER!', {
      fontSize: '7px', color: '#445566', fontFamily: PF
    }).setOrigin(0.5);

    // 블록 생성
    this.blockHeight = 52;
    this.blockStartY = 148;

    this.shuffled.forEach((line, i) => {
      this.createBlock(line, i);
    });

    // 결과 텍스트
    this.resultTxt = this.add.text(W/2, 530, '', {
      fontSize: '12px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.statTxt = this.add.text(W/2, 558, '', {
      fontSize: '9px', color: '#aaddff', fontFamily: PF
    }).setOrigin(0.5);

    // 확인 버튼
    this.checkBtnBg = this.add.rectangle(W/2 + 3, 573, 204, 46, 0x000000, 0.8);
    this.checkBtn = this.add.rectangle(W/2, 570, 200, 42, 0x440088)
      .setInteractive().setStrokeStyle(3, 0xcc55ff);
    this.checkBtnTxt = this.add.text(W/2, 570, '► CHECK ANSWER', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    this.checkBtn.on('pointerover', () => this.checkBtn.setFillStyle(0xcc55ff));
    this.checkBtn.on('pointerout', () => this.checkBtn.setFillStyle(0x440088));
    this.checkBtn.on('pointerdown', () => this.checkAnswer());

    // 타이머
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: this.tick, callbackScope: this
    });
  }

  createBlock(line, index) {
    const W = 800;
    const y = this.blockStartY + index * (this.blockHeight + 6);

    // 그림자
    this.add.rectangle(W/2 + 3, y + 3, 700, this.blockHeight, 0x000000, 0.7);

    const bg = this.add.rectangle(W/2, y, 700, this.blockHeight, 0x0d1117)
      .setStrokeStyle(2, 0xcc55ff)
      .setInteractive({ draggable: true });

    // 번호 박스
    const numBox = this.add.rectangle(58, y, 30, this.blockHeight - 8, 0x440088)
      .setStrokeStyle(1, 0xcc55ff);
    const numTxt = this.add.text(58, y, String(index + 1), {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 드래그 핸들
    const handle = this.add.text(88, y, '⠿', {
      fontSize: '16px', color: '#cc55ff'
    }).setOrigin(0.5);

    const text = this.add.text(W/2 + 10, y, line, {
      fontSize: '13px', color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    const block = { bg, text, handle, numBox, numTxt, line, index };
    this.blocks.push(block);

    bg.on('dragstart', () => {
      bg.setFillStyle(0x220044);
      bg.setDepth(10);
      text.setDepth(10);
      handle.setDepth(10);
      numBox.setDepth(10);
      numTxt.setDepth(10);
    });

    bg.on('drag', (pointer) => {
      const newY = Phaser.Math.Clamp(pointer.y, 130, 500);
      bg.setY(newY);
      text.setY(newY);
      handle.setY(newY);
      numBox.setY(newY);
      numTxt.setY(newY);
    });

    bg.on('dragend', () => {
      bg.setFillStyle(0x0d1117);
      bg.setDepth(0);
      text.setDepth(0);
      handle.setDepth(0);
      numBox.setDepth(0);
      numTxt.setDepth(0);
      this.snapToGrid();
    });

    this.input.setDraggable(bg);
  }

  snapToGrid() {
    this.blocks.sort((a, b) => a.bg.y - b.bg.y);

    this.blocks.forEach((block, i) => {
      const targetY = this.blockStartY + i * (this.blockHeight + 6);
      this.tweens.add({
        targets: [block.bg, block.text, block.handle, block.numBox, block.numTxt],
        y: targetY, duration: 120, ease: 'Power2'
      });
      // 번호 업데이트
      block.numTxt.setText(String(i + 1));
      block.index = i;
    });
  }

  checkAnswer() {
    if (this.answered) return;

    const currentOrder = this.blocks.map(b => b.line);
    const isCorrect = currentOrder.every((line, i) => line === this.correctOrder[i]);

    if (isCorrect) {
      this.endGame(true);
    } else {
      this.blocks.forEach((block, i) => {
        if (block.line !== this.correctOrder[i]) {
          block.bg.setStrokeStyle(3, 0xff4444);
          block.text.setColor('#ff8888');
          block.numBox.setFillStyle(0x880000);
        } else {
          block.bg.setStrokeStyle(3, 0x00cc66);
          block.numBox.setFillStyle(0x006622);
        }
      });

      this.resultTxt.setColor('#ff4444').setText('✗ WRONG ORDER! TRY AGAIN');

      this.time.delayedCall(900, () => {
        if (!this.answered) {
          this.blocks.forEach(block => {
            block.bg.setStrokeStyle(2, 0xcc55ff);
            block.text.setColor('#ffffff');
            block.numBox.setFillStyle(0x440088);
          });
          this.resultTxt.setText('');
        }
      });
    }
  }

  tick() {
    if (this.answered) return;
    this.timeLeft--;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);

    const ratio = this.timeLeft / 60;
    this.timerBar.setScale(ratio, 1);
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff4444);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    else this.timerBar.setFillStyle(0xcc55ff);

    if (this.timeLeft <= 0) this.endGame(false);
  }

  endGame(success) {
    if (this.answered) return;
    this.answered = true;
    this.timerEvent.remove();

    this.checkBtn.setVisible(false);
    this.checkBtnTxt.setVisible(false);
    this.checkBtnBg.setVisible(false);

    let msg, color, stat;

    if (success) {
      const remaining = this.timeLeft;
      this.blocks.forEach(block => {
        block.bg.setStrokeStyle(3, 0x00cc66);
        block.bg.setFillStyle(0x002211);
        block.numBox.setFillStyle(0x006622);
      });
      this.cameras.main.flash(200, 0, 255, 100, false);

      if (remaining > 40) {
        msg = '⚡ PERFECT! GENIUS CODER!';
        color = '#FFD700';
        stat = 'INT +10    GP +30';
      } else if (remaining > 20) {
        msg = '✅ CORRECT!';
        color = '#00ff88';
        stat = 'INT +7    GP +20';
      } else {
        msg = '👍 CLEAR!';
        color = '#aaddff';
        stat = 'INT +5    GP +10';
      }
    } else {
      msg = '⏰ TIME UP...';
      color = '#ff4444';
      stat = 'STRESS +5';
      this.cameras.main.shake(300, 0.008);

      // 정답 보여주기
      this.correctOrder.forEach((line, i) => {
        const targetY = this.blockStartY + i * (this.blockHeight + 6);
        this.blocks[i].text.setText(line).setY(targetY).setColor('#ffaa44');
        this.blocks[i].bg.setY(targetY).setStrokeStyle(2, 0xffaa44);
        this.blocks[i].handle.setY(targetY);
        this.blocks[i].numBox.setY(targetY);
        this.blocks[i].numTxt.setY(targetY);
      });
    }

    this.resultTxt.setColor(color).setText(msg);
    this.statTxt.setText(stat);

    this.time.delayedCall(400, () => {
      this.createBtn(270, 572, 'RETRY', 0x440088, 0xcc55ff, () => this.scene.restart());
      this.createBtn(530, 572, 'MENU', 0x001888, 0x4499ff, () => this.scene.start('MenuScene'));
    });
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 3, y + 3, 200, 46, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 42, bg)
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