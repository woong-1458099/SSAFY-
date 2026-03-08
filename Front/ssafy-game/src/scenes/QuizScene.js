import Phaser from 'phaser';

const QUESTIONS = [
    {
        question: "OSI 7계층에서 전송 계층 프로토콜은?",
        options: ["HTTP", "TCP", "IP", "FTP"],
        answer: 1
    },
    {
        question: "데이터베이스에서 기본키(Primary Key)의 특징은?",
        options: ["중복 허용", "NULL 허용", "유일성 보장", "외래키와 동일"],
        answer: 2
    },
    {
        question: "프로세스와 스레드의 차이로 올바른 것은?",
        options: [
            "스레드는 독립적인 메모리를 가진다",
            "프로세스는 스레드보다 가볍다",
            "스레드는 프로세스 내 자원을 공유한다",
            "프로세스는 스레드를 포함할 수 없다"
        ],
        answer: 2
    },
    {
        question: "SQL에서 GROUP BY와 함께 사용하는 조건절은?",
        options: ["WHERE", "HAVING", "ORDER BY", "JOIN"],
        answer: 1
    },
    {
        question: "시간 복잡도 O(n log n)인 정렬 알고리즘은?",
        options: ["버블 정렬", "선택 정렬", "삽입 정렬", "퀵 정렬"],
        answer: 3
    }
];

export default class QuizScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuizScene' });
    }

    create() {
        this.currentIndex = 0;
        this.score = 0;
        this.timeLeft = 15;
        this.answered = false;
        this.questions = Phaser.Utils.Array.Shuffle([...QUESTIONS]);

        // 배경
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        // 상단 바
        this.add.rectangle(400, 40, 800, 80, 0x1E3A5F);

        // 문제 번호
        this.questionNum = this.add.text(30, 20, '', {
            fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial'
        });

        // 타이머 텍스트
        this.timerText = this.add.text(740, 20, '', {
            fontSize: '20px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(1, 0);

        // 타이머 바 배경
        this.add.rectangle(400, 75, 700, 12, 0x333333);
        this.timerBar = this.add.rectangle(50, 75, 700, 12, 0x00cc66).setOrigin(0, 0.5);

        // 문제 텍스트
        this.questionText = this.add.text(400, 160, '', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            wordWrap: { width: 680 },
            align: 'center'
        }).setOrigin(0.5);

        // 선택지 버튼 4개
        this.optionBtns = [];
        const btnColors = [0x2E5F9F, 0x2E5F9F, 0x2E5F9F, 0x2E5F9F];

        for (let i = 0; i < 4; i++) {
            const y = 280 + i * 75;

            const bg = this.add.rectangle(400, y, 680, 60, btnColors[i], 1)
                .setInteractive()
                .setStrokeStyle(2, 0x4488cc);

            const label = this.add.text(400, y, '', {
                fontSize: '17px',
                color: '#ffffff',
                fontFamily: 'Arial',
                wordWrap: { width: 640 },
                align: 'center'
            }).setOrigin(0.5);

            bg.on('pointerover', () => {
                if (!this.answered) bg.setFillStyle(0x3a6fc0);
            });
            bg.on('pointerout', () => {
                if (!this.answered) bg.setFillStyle(0x2E5F9F);
            });
            bg.on('pointerdown', () => this.checkAnswer(i));

            this.optionBtns.push({ bg, label });
        }

        // 결과 텍스트
        this.resultText = this.add.text(400, 570, '', {
            fontSize: '20px', color: '#FFD700', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 점수 텍스트
        this.scoreText = this.add.text(400, 540, '', {
            fontSize: '16px', color: '#aaaaaa', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 타이머 이벤트
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.tick,
            callbackScope: this,
            loop: true
        });

        this.showQuestion();
    }

    showQuestion() {
        this.answered = false;
        this.timeLeft = 15;
        this.resultText.setText('');
        this.scoreText.setText(`점수: ${this.score} / ${this.currentIndex}`);

        const q = this.questions[this.currentIndex];

        this.questionNum.setText(`문제 ${this.currentIndex + 1} / ${this.questions.length}`);
        this.questionText.setText(q.question);

        q.options.forEach((opt, i) => {
            this.optionBtns[i].label.setText(`${i + 1}.  ${opt}`);
            this.optionBtns[i].bg.setFillStyle(0x2E5F9F);
            this.optionBtns[i].bg.setInteractive();
        });

        this.timerBar.setScale(1, 1);
    }

    tick() {
        if (this.answered) return;
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}초`);

        // 타이머 바 줄어들기
        const ratio = this.timeLeft / 15;
        this.timerBar.setScale(ratio, 1);
        if (ratio < 0.3) this.timerBar.setFillStyle(0xff4444);
        else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
        else this.timerBar.setFillStyle(0x00cc66);

        if (this.timeLeft <= 0) {
            this.checkAnswer(-1); // 시간 초과
        }
    }

    checkAnswer(selected) {
        if (this.answered) return;
        this.answered = true;

        const correct = this.questions[this.currentIndex].answer;
        const isCorrect = selected === correct;

        // 정답/오답 색상 표시
        this.optionBtns.forEach((btn, i) => {
            btn.bg.disableInteractive();
            if (i === correct) btn.bg.setFillStyle(0x00aa44);        // 정답 초록
            else if (i === selected) btn.bg.setFillStyle(0xcc2222);  // 선택한 오답 빨강
            else btn.bg.setFillStyle(0x333333);                       // 나머지 회색
        });

        if (isCorrect) {
            this.score++;
            this.resultText.setColor('#00ff88').setText('✅ 정답!');
        } else if (selected === -1) {
            this.resultText.setColor('#ff4444').setText('⏰ 시간 초과!');
        } else {
            this.resultText.setColor('#ff4444').setText('❌ 오답!');
        }

        // 1.5초 후 다음 문제 or 종료
        this.time.delayedCall(1500, () => {
            this.currentIndex++;
            if (this.currentIndex < this.questions.length) {
                this.showQuestion();
            } else {
                this.endGame();
            }
        });
    }

    endGame() {
        this.timerEvent.remove();

        // 화면 클리어
        this.children.removeAll();
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);

        const total = this.questions.length;
        const ratio = this.score / total;

        let grade, color, statMsg;
        if (ratio >= 0.8) {
            grade = '🏆 완벽해요!';
            color = '#FFD700';
            statMsg = '지능 +10  재화 +30';
        } else if (ratio >= 0.6) {
            grade = '👍 잘했어요!';
            color = '#00ff88';
            statMsg = '지능 +5  재화 +15';
        } else {
            grade = '😅 더 공부해요!';
            color = '#ff8844';
            statMsg = '지능 +2  스트레스 +5';
        }

        this.add.text(400, 180, '퀴즈 종료!', {
            fontSize: '32px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 260, `${this.score} / ${total} 정답`, {
            fontSize: '28px', color: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 330, grade, {
            fontSize: '26px', color, fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 400, statMsg, {
            fontSize: '22px', color: '#aaddff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 다시하기 버튼
        const retryBtn = this.add.rectangle(400, 490, 200, 50, 0x2E5F9F)
            .setInteractive()
            .setStrokeStyle(2, 0x4488cc);
        this.add.text(400, 490, '다시 하기', {
            fontSize: '20px', color: '#ffffff', fontFamily: 'Arial'
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