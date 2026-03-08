import Phaser from 'phaser';

const CHALLENGES = [
    {
        desc: '버블 정렬 완성하기',
        lines: [
            'for i in range(n):',
            '  for j in range(n-i-1):',
            '    if arr[j] > arr[j+1]:',
            '      arr[j], arr[j+1] = arr[j+1], arr[j]',
        ]
    },
    {
        desc: '피보나치 수열 구하기',
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
        desc: '이진 탐색 구현하기',
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
        this.answered = false;
        this.timeLeft = 60;
        this.dragTarget = null;
        this.blocks = [];

        // 문제 선택
        this.challenge = Phaser.Math.RND.pick(CHALLENGES);
        // 정답 순서 저장
        this.correctOrder = [...this.challenge.lines];
        // 섞기
        this.shuffled = Phaser.Utils.Array.Shuffle([...this.challenge.lines]);

        // 배경
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        // 상단 바
        this.add.rectangle(400, 40, 800, 80, 0x1E3A5F);

        // 타이틀
        this.add.text(400, 15, '🧩  코드 순서 맞추기', {
            fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial'
        }).setOrigin(0.5, 0);

        // 타이머
        this.timerText = this.add.text(740, 15, '60초', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // 타이머 바
        this.add.rectangle(400, 75, 700, 12, 0x333333);
        this.timerBar = this.add.rectangle(50, 75, 700, 12, 0x00cc66).setOrigin(0, 0.5);

        // 문제 설명
        this.add.text(400, 110, '💡 ' + this.challenge.desc, {
            fontSize: '17px', color: '#aaddff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 안내
        this.add.text(400, 140, '블록을 드래그해서 올바른 순서로 정렬하세요!', {
            fontSize: '14px', color: '#666666', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 드래그 블록 생성
        this.blockHeight = 52;
        this.blockStartY = 175;
        this.blockX = 400;

        this.shuffled.forEach((line, i) => {
            this.createBlock(line, i);
        });

        // 결과 텍스트
        this.resultText = this.add.text(400, 530, '', {
            fontSize: '20px', color: '#FFD700', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.statText = this.add.text(400, 560, '', {
            fontSize: '16px', color: '#aaddff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 확인 버튼
        this.checkBtn = this.add.rectangle(400, 565, 160, 44, 0x1E6F3F)
            .setInteractive().setStrokeStyle(2, 0x44aa66);
        this.checkBtnText = this.add.text(400, 565, '✅ 정답 확인', {
            fontSize: '17px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.checkBtn.on('pointerdown', () => this.checkAnswer());
        this.checkBtn.on('pointerover', () => this.checkBtn.setFillStyle(0x258a50));
        this.checkBtn.on('pointerout', () => this.checkBtn.setFillStyle(0x1E6F3F));

        // 타이머
        this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true,
            callback: this.tick, callbackScope: this
        });
    }

    createBlock(line, index) {
        const y = this.blockStartY + index * (this.blockHeight + 8);

        const bg = this.add.rectangle(this.blockX, y, 700, this.blockHeight, 0x0d1117)
            .setStrokeStyle(2, 0x4488cc)
            .setInteractive({ draggable: true });

        const text = this.add.text(this.blockX, y, line, {
            fontSize: '16px', color: '#ffffff', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 드래그 핸들 아이콘
        const handle = this.add.text(60, y, '⠿', {
            fontSize: '20px', color: '#4488cc', fontFamily: 'Arial'
        }).setOrigin(0.5);

        const block = { bg, text, handle, line, index };
        this.blocks.push(block);

        // 드래그 이벤트
        bg.on('dragstart', () => {
            this.dragTarget = block;
            bg.setFillStyle(0x1a2a4a);
            bg.setDepth(10);
            text.setDepth(10);
            handle.setDepth(10);
        });

        bg.on('drag', (pointer) => {
            const newY = pointer.y;
            bg.setY(newY);
            text.setY(newY);
            handle.setY(newY);
        });

        bg.on('dragend', () => {
            bg.setFillStyle(0x0d1117);
            bg.setDepth(0);
            text.setDepth(0);
            handle.setDepth(0);
            this.snapToGrid();
        });

        this.input.setDraggable(bg);
    }

    snapToGrid() {
        // Y 좌표 기준으로 블록 재정렬
        this.blocks.sort((a, b) => a.bg.y - b.bg.y);

        this.blocks.forEach((block, i) => {
            const targetY = this.blockStartY + i * (this.blockHeight + 8);
            this.tweens.add({
                targets: [block.bg, block.text, block.handle],
                y: targetY,
                duration: 150,
                ease: 'Power2'
            });
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
            // 틀린 줄 빨간색으로 표시
            this.blocks.forEach((block, i) => {
                if (block.line !== this.correctOrder[i]) {
                    block.bg.setStrokeStyle(2, 0xff4444);
                    block.text.setColor('#ff8888');
                } else {
                    block.bg.setStrokeStyle(2, 0x00cc66);
                }
            });

            this.resultText.setColor('#ff4444').setText('❌ 틀렸어요! 다시 시도해보세요.');

            // 0.8초 후 힌트 제거
            this.time.delayedCall(800, () => {
                if (!this.answered) {
                    this.blocks.forEach(block => {
                        block.bg.setStrokeStyle(2, 0x4488cc);
                        block.text.setColor('#ffffff');
                    });
                    this.resultText.setText('');
                }
            });
        }
    }

    tick() {
        if (this.answered) return;
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}초`);

        const ratio = this.timeLeft / 60;
        this.timerBar.setScale(ratio, 1);
        if (ratio < 0.3) this.timerBar.setFillStyle(0xff4444);
        else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
        else this.timerBar.setFillStyle(0x00cc66);

        if (this.timeLeft <= 0) this.endGame(false);
    }

    endGame(success) {
        if (this.answered) return;
        this.answered = true;
        this.timerEvent.remove();

        // 확인 버튼 숨기기
        this.checkBtn.setVisible(false);
        this.checkBtnText.setVisible(false);

        let msg, color, statMsg;

        if (success) {
            const remaining = this.timeLeft;
            // 정답 블록 초록색으로
            this.blocks.forEach(block => {
                block.bg.setStrokeStyle(2, 0x00cc66);
                block.bg.setFillStyle(0x0d2a1a);
            });

            if (remaining > 40) {
                msg = '⚡ 완벽해요! 천재 개발자!';
                color = '#FFD700';
                statMsg = '지능 +10  재화 +30';
            } else if (remaining > 20) {
                msg = '✅ 정답!';
                color = '#00ff88';
                statMsg = '지능 +7  재화 +20';
            } else {
                msg = '👍 성공!';
                color = '#aaddff';
                statMsg = '지능 +5  재화 +10';
            }
        } else {
            msg = '⏰ 시간 초과...';
            color = '#ff4444';
            statMsg = '스트레스 +5';

            // 정답 보여주기
            this.correctOrder.forEach((line, i) => {
                const targetY = this.blockStartY + i * (this.blockHeight + 8);
                this.blocks[i].text.setText(line).setY(targetY).setColor('#ffaa44');
                this.blocks[i].bg.setY(targetY).setStrokeStyle(2, 0xffaa44);
                this.blocks[i].handle.setY(targetY);
            });
        }

        this.resultText.setColor(color).setText(msg);
        this.statText.setText(statMsg);

        // 다시하기 버튼
        const retryBtn = this.add.rectangle(290, 565, 160, 44, 0x2E5F9F)
            .setInteractive().setStrokeStyle(2, 0x4488cc);
        this.add.text(290, 565, '다시 하기', {
            fontSize: '17px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        retryBtn.on('pointerdown', () => this.scene.restart());
        retryBtn.on('pointerover', () => retryBtn.setFillStyle(0x3a6fc0));
        retryBtn.on('pointerout', () => retryBtn.setFillStyle(0x2E5F9F));

        // 메뉴로 돌아가기
        const menuBtn = this.add.rectangle(400, 595, 160, 36, 0x333333)
            .setInteractive().setStrokeStyle(1, 0x555555);
        this.add.text(400, 595, '◀ 메뉴로', {
            fontSize: '15px', color: '#aaaaaa', fontFamily: 'Arial'
        }).setOrigin(0.5);

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x444444));
        menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x333333));
    }
}