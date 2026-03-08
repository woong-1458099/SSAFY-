import Phaser from 'phaser';

const CODE_CHALLENGES = [
    { code: 'for i in range(n): print(i)', desc: '반복문으로 0부터 n-1 출력' },
    { code: 'def solution(arr): return sorted(arr)', desc: '배열을 정렬하여 반환' },
    { code: 'if n % 2 == 0: return True', desc: 'n이 짝수이면 True 반환' },
    { code: 'stack = []; stack.append(x)', desc: '스택에 원소 추가' },
    { code: 'return max(dp[i] for i in range(n))', desc: 'DP 배열의 최댓값 반환' },
    { code: 'graph[a].append(b)', desc: '인접 리스트에 간선 추가' },
    { code: 'while left <= right: mid = (left+right)//2', desc: '이진 탐색 기본 구조' },
];

export default class TypingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TypingScene' });
    }

    create() {
        this.typedText = '';
        this.timeLeft = 20;
        this.answered = false;
        this.startTime = null;
        this.challenge = Phaser.Math.RND.pick(CODE_CHALLENGES);

        // 배경
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        // 상단 바
        this.add.rectangle(400, 40, 800, 80, 0x1E3A5F);

        // 타이틀
        this.add.text(400, 20, '⌨️  알고리즘 타이핑', {
            fontSize: '18px', color: '#aaaaaa', fontFamily: 'Arial'
        }).setOrigin(0.5, 0);

        // 타이머
        this.timerText = this.add.text(740, 15, '20초', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // 타이머 바
        this.add.rectangle(400, 75, 700, 12, 0x333333);
        this.timerBar = this.add.rectangle(50, 75, 700, 12, 0x00cc66).setOrigin(0, 0.5);

        // 문제 설명
        this.add.text(400, 130, '💡 ' + this.challenge.desc, {
            fontSize: '18px', color: '#aaddff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 목표 코드 박스
        this.add.rectangle(400, 210, 720, 70, 0x0d1117)
            .setStrokeStyle(2, 0x4488cc);
        this.add.text(400, 210, this.challenge.code, {
            fontSize: '22px', color: '#FFD700', fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 입력창 박스
        this.inputBox = this.add.rectangle(400, 320, 720, 70, 0x0d1117)
            .setStrokeStyle(2, 0x555555);
        this.inputDisplay = this.add.text(60, 295, '', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace'
        });

        // 커서 깜빡임
        this.cursor = this.add.text(60, 295, '|', {
            fontSize: '22px', color: '#ffffff', fontFamily: 'monospace'
        });
        this.time.addEvent({
            delay: 500, loop: true,
            callback: () => { this.cursor.setVisible(!this.cursor.visible); }
        });

        // 진행 바 (정확도)
        this.add.text(60, 370, '진행도', {
            fontSize: '14px', color: '#888888', fontFamily: 'Arial'
        });
        this.add.rectangle(400, 400, 720, 16, 0x333333);
        this.progressBar = this.add.rectangle(40, 400, 0, 16, 0x00cc66).setOrigin(0, 0.5);

        // 결과 텍스트
        this.resultText = this.add.text(400, 460, '', {
            fontSize: '22px', color: '#FFD700', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.statText = this.add.text(400, 500, '', {
            fontSize: '18px', color: '#aaddff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 안내 텍스트
        this.hintText = this.add.text(400, 550, '위 코드를 똑같이 입력하세요!', {
            fontSize: '16px', color: '#666666', fontFamily: 'Arial'
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
            this.checkAnswer();
            return;
        } else if (event.key.length === 1) {
            this.typedText += event.key;
        }

        this.updateDisplay();
        this.checkAnswer();
    }

    updateDisplay() {
        const target = this.challenge.code;
        const typed = this.typedText;

        // 글자별 색상 표시 (맞으면 초록, 틀리면 빨강)
        let displayStr = '';
        for (let i = 0; i < typed.length; i++) {
            if (typed[i] === target[i]) {
                displayStr += typed[i]; // 맞는 글자
            } else {
                displayStr += typed[i]; // 틀린 글자 (색은 Phaser 텍스트 한계로 단순 표시)
            }
        }
        this.inputDisplay.setText(displayStr);

        // 커서 위치 업데이트
        const charWidth = 13.2;
        this.cursor.setX(60 + typed.length * charWidth);

        // 진행 바 업데이트
        const progress = Math.min(typed.length / target.length, 1);
        this.progressBar.setScale(progress * 7.2, 1); // 720px 기준

        // 정확도에 따라 색상 변경
        const correct = typed.split('').filter((c, i) => c === target[i]).length;
        const accuracy = typed.length > 0 ? correct / typed.length : 1;
        if (accuracy > 0.8) this.progressBar.setFillStyle(0x00cc66);
        else if (accuracy > 0.5) this.progressBar.setFillStyle(0xffaa00);
        else this.progressBar.setFillStyle(0xff4444);

        // 입력창 테두리 색 변경
        const isCorrectSoFar = target.startsWith(typed);
        this.inputBox.setStrokeStyle(2, isCorrectSoFar ? 0x00cc66 : 0xff4444);
    }

    checkAnswer() {
        if (this.typedText === this.challenge.code) {
            this.endGame(true);
        }
    }

    tick() {
        if (this.answered) return;
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}초`);

        const ratio = this.timeLeft / 20;
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
        this.input.keyboard.off('keydown', this.handleKey, this);
        this.cursor.setVisible(false);
        this.hintText.setVisible(false);

        let statBonus, msg, color;

        if (success) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            if (elapsed < 8) {
                msg = '⚡ 완벽해요! 초고속 타이핑!';
                color = '#FFD700';
                statBonus = '지능 +7  재화 +20';
            } else if (elapsed < 14) {
                msg = '✅ 성공!';
                color = '#00ff88';
                statBonus = '지능 +5  재화 +10';
            } else {
                msg = '👍 완료!';
                color = '#aaddff';
                statBonus = '지능 +3  재화 +5';
            }
        } else {
            msg = '⏰ 시간 초과...';
            color = '#ff4444';
            statBonus = '스트레스 +5';
        }

        this.resultText.setColor(color).setText(msg);
        this.statText.setText(statBonus);

        // 다시하기 버튼
        const retryBtn = this.add.rectangle(300, 560, 180, 46, 0x2E5F9F)
            .setInteractive().setStrokeStyle(2, 0x4488cc);
        this.add.text(300, 560, '다시 하기', {
            fontSize: '18px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 다음 게임 버튼
        const nextBtn = this.add.rectangle(510, 560, 180, 46, 0x1E6F3F)
            .setInteractive().setStrokeStyle(2, 0x44aa66);
        this.add.text(510, 560, '다음 문제 ▶', {
            fontSize: '18px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        retryBtn.on('pointerdown', () => this.scene.restart());
        retryBtn.on('pointerover', () => retryBtn.setFillStyle(0x3a6fc0));
        retryBtn.on('pointerout', () => retryBtn.setFillStyle(0x2E5F9F));

        nextBtn.on('pointerdown', () => this.scene.restart());
        nextBtn.on('pointerover', () => nextBtn.setFillStyle(0x258a50));
        nextBtn.on('pointerout', () => nextBtn.setFillStyle(0x1E6F3F));

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