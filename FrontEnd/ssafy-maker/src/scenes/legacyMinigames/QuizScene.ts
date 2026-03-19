// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

const QUESTIONS = [
  // 네트워크
  { question: 'OSI 7계층에서 전송 계층 프로토콜은?', options: ['HTTP', 'TCP', 'IP', 'FTP'], answer: 1 },
  { question: 'TCP/IP 4계층 중 최상위 계층은?', options: ['네트워크', '전송', '인터넷', '응용'], answer: 3 },
  { question: 'HTTP 상태코드 404의 의미는?', options: ['서버 오류', '인증 필요', '찾을 수 없음', '권한 없음'], answer: 2 },
  { question: 'HTTP 상태코드 500의 의미는?', options: ['클라이언트 오류', '서버 내부 오류', '리다이렉션', '인증 필요'], answer: 1 },
  { question: 'DNS의 주요 역할은?', options: ['데이터 암호화', '도메인을 IP로 변환', 'IP 주소 할당', '패킷 라우팅'], answer: 1 },

  // 데이터베이스
  { question: '기본키(Primary Key)의 특징으로 올바른 것은?', options: ['중복 허용', 'NULL 허용', '유일성 보장', '외래키와 동일'], answer: 2 },
  { question: 'GROUP BY와 함께 사용하는 조건절은?', options: ['WHERE', 'HAVING', 'ORDER BY', 'JOIN'], answer: 1 },
  { question: 'DBMS에서 트랜잭션의 ACID 중 A는?', options: ['Atomicity', 'Availability', 'Accuracy', 'Authentication'], answer: 0 },
  { question: '정규화의 목적으로 올바른 것은?', options: ['데이터 중복 증가', '이상현상 제거', '조회 속도 저하', '테이블 수 감소'], answer: 1 },
  { question: 'INNER JOIN의 결과는?', options: ['왼쪽 테이블 전체', '오른쪽 테이블 전체', '양쪽 교집합', '양쪽 합집합'], answer: 2 },

  // 운영체제
  { question: '프로세스와 스레드의 차이로 올바른 것은?', options: ['스레드는 독립 메모리', '프로세스가 더 가볍다', '스레드는 자원 공유', '프로세스는 스레드 미포함'], answer: 2 },
  { question: '교착상태(Deadlock) 발생 조건이 아닌 것은?', options: ['상호 배제', '점유와 대기', '선점 가능', '순환 대기'], answer: 2 },
  { question: '가상 메모리의 장점이 아닌 것은?', options: ['메모리 확장', '메모리 보호', '처리 속도 향상', '다중 프로그래밍'], answer: 2 },

  // 알고리즘
  { question: '시간복잡도 O(n log n)인 정렬 알고리즘은?', options: ['버블 정렬', '선택 정렬', '삽입 정렬', '퀵 정렬'], answer: 3 },
  { question: '스택(Stack)의 특징은?', options: ['FIFO', 'LIFO', 'Random Access', 'Priority'], answer: 1 },
  { question: '이진 탐색의 시간복잡도는?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], answer: 2 },

  // 소프트웨어 공학
  { question: '애자일 방법론의 특징이 아닌 것은?', options: ['반복 개발', '문서 중심', '고객 협력', '변화 대응'], answer: 1 },
  { question: 'UML 다이어그램 중 동적 모델링은?', options: ['클래스 다이어그램', '시퀀스 다이어그램', '패키지 다이어그램', '컴포넌트 다이어그램'], answer: 1 },
];

export default class QuizScene extends Phaser.Scene {
  private returnSceneKey = 'MainScene';

  constructor() { super({ key: 'QuizScene' }); }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'MainScene';
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = 20;
    this.answered = false;
    this.questions = Phaser.Utils.Array.Shuffle([...QUESTIONS]).slice(0, 8);

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0f1a2e);

    // 상단 헤더
    this.add.rectangle(W / 2, 40, W, 80, 0x162447);
    this.add.rectangle(W / 2, 0, W, 4, 0xFFD700);
    this.add.rectangle(W / 2, 80, W, 3, 0x4488ff);

    this.add.text(W / 2, 25, '📝 정보처리기사 퀴즈', {
      fontSize: '20px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.questionNum = this.add.text(30, 55, 'Q 1/8', {
      fontSize: '14px', color: '#88ccff', fontFamily: PF
    });

    this.scoreText = this.add.text(W - 30, 55, 'SCORE: 0', {
      fontSize: '14px', color: '#00ff88', fontFamily: PF
    }).setOrigin(1, 0);

    // 타이머 영역
    this.add.rectangle(W / 2, 105, W - 60, 20, 0x1a1a3e);
    this.timerBar = this.add.rectangle(30, 105, W - 60, 16, 0x00cc66).setOrigin(0, 0.5);
    this.timerText = this.add.text(W / 2, 105, '20', {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 질문 박스
    this.add.rectangle(W / 2, 185, W - 40, 100, 0x1e3a5f).setStrokeStyle(3, 0x4488ff);
    this.questionText = this.add.text(W / 2, 185, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: PF,
      align: 'center', wordWrap: { width: W - 100 }, lineSpacing: 8
    }).setOrigin(0.5);

    // 옵션 버튼
    this.optionBtns = [];
    const optLabels = ['A', 'B', 'C', 'D'];
    const optColors = [0x4488ff, 0x44aa44, 0xff8800, 0xff4466];

    for (let i = 0; i < 4; i++) {
      const y = 280 + i * 75;

      // 그림자
      this.add.rectangle(W / 2 + 3, y + 3, W - 60, 60, 0x000000, 0.5);

      const bg = this.add.rectangle(W / 2, y, W - 60, 56, 0x0d1830)
        .setInteractive()
        .setStrokeStyle(3, optColors[i]);

      // 번호 뱃지
      this.add.rectangle(55, y, 44, 44, optColors[i]);
      this.add.text(55, y, optLabels[i], {
        fontSize: '18px', color: '#ffffff', fontFamily: PF
      }).setOrigin(0.5);

      const label = this.add.text(W / 2 + 20, y, '', {
        fontSize: '14px', color: '#ffffff', fontFamily: PF,
        align: 'center', wordWrap: { width: W - 180 }
      }).setOrigin(0.5);

      bg.on('pointerover', () => {
        if (!this.answered) {
          bg.setFillStyle(0x1a3050);
          this.tweens.add({ targets: bg, scaleX: 1.02, scaleY: 1.02, duration: 80 });
        }
      });
      bg.on('pointerout', () => {
        if (!this.answered) {
          bg.setFillStyle(0x0d1830);
          this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 80 });
        }
      });
      bg.on('pointerdown', () => this.checkAnswer(i));

      this.optionBtns.push({ bg, label });
    }

    // 결과 텍스트
    this.resultText = this.add.text(W / 2, H - 30, '', {
      fontSize: '16px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.timerEvent = this.time.addEvent({
      delay: 1000, callback: this.tick, callbackScope: this, loop: true
    });

    // 씬 종료 시 정리
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);

    this.showQuestion();
  }

  showQuestion() {
    this.answered = false;
    this.timeLeft = 20;
    this.resultText.setText('');

    const q = this.questions[this.currentIndex];
    this.questionNum.setText(`Q ${this.currentIndex + 1}/${this.questions.length}`);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.questionText.setText(q.question);

    q.options.forEach((opt, i) => {
      this.optionBtns[i].label.setText(opt);
      this.optionBtns[i].bg.setFillStyle(0x0d1830);
      this.optionBtns[i].bg.setInteractive();
      this.optionBtns[i].bg.setScale(1);
    });

    this.timerBar.setScale(1, 1).setFillStyle(0x00cc66);
    this.timerText.setText('20');
  }

  tick() {
    if (this.answered) return;

    this.timeLeft--;
    this.timerText.setText(String(this.timeLeft));

    const ratio = this.timeLeft / 20;
    this.timerBar.setScale(ratio, 1);

    if (ratio < 0.25) {
      this.timerBar.setFillStyle(0xff4444);
      this.timerText.setColor('#ff4444');
    } else if (ratio < 0.5) {
      this.timerBar.setFillStyle(0xffaa00);
      this.timerText.setColor('#ffaa00');
    } else {
      this.timerBar.setFillStyle(0x00cc66);
      this.timerText.setColor('#ffffff');
    }

    if (this.timeLeft <= 0) this.checkAnswer(-1);
  }

  checkAnswer(selected) {
    if (this.answered) return;
    this.answered = true;

    const correct = this.questions[this.currentIndex].answer;
    const isCorrect = selected === correct;

    this.optionBtns.forEach((btn, i) => {
      btn.bg.disableInteractive();
      if (i === correct) {
        btn.bg.setFillStyle(0x00aa44);
        btn.label.setColor('#00ff88');
      } else if (i === selected) {
        btn.bg.setFillStyle(0xaa2222);
        btn.label.setColor('#ff8888');
      } else {
        btn.bg.setFillStyle(0x222233);
        btn.label.setColor('#666666');
      }
    });

    if (isCorrect) {
      this.score++;
      this.cameras.main.flash(150, 0, 255, 100, false);
      this.resultText.setColor('#00ff88').setText('✓ 정답입니다!');
    } else if (selected === -1) {
      this.resultText.setColor('#ff6644').setText('⏰ 시간 초과!');
      this.cameras.main.shake(150, 0.005);
    } else {
      this.cameras.main.shake(200, 0.008);
      this.resultText.setColor('#ff4444').setText('✗ 오답입니다...');
    }

    this.time.delayedCall(1500, () => {
      this.currentIndex++;
      if (this.currentIndex < this.questions.length) this.showQuestion();
      else this.endGame();
    });
  }

  endGame() {
    this.timerEvent.remove();
    this.children.removeAll();

    this.add.rectangle(W / 2, H / 2, W, H, 0x0f1a2e);
    this.add.rectangle(W / 2, 0, W, 4, 0xFFD700);

    // 결과 박스
    this.add.rectangle(W / 2, H / 2, 500, 380, 0x162447).setStrokeStyle(4, 0xFFD700);

    this.add.text(W / 2, 150, '📝 퀴즈 결과', {
      fontSize: '24px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    const total = this.questions.length;
    const ratio = this.score / total;

    let grade, color, statMsg;
    if (ratio >= 0.8) {
      grade = '🏆 EXCELLENT!';
      color = '#FFD700';
      statMsg = '지능 +10, GP +30';
    } else if (ratio >= 0.6) {
      grade = '✅ GOOD!';
      color = '#00ff88';
      statMsg = '지능 +5, GP +15';
    } else {
      grade = '📚 TRY AGAIN';
      color = '#ff8844';
      statMsg = '지능 +2, 스트레스 +5';
    }

    this.add.text(W / 2, 220, `${this.score} / ${total}`, {
      fontSize: '48px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, grade, {
      fontSize: '20px', color, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 340, statMsg, {
      fontSize: '14px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(W / 2 - 120, 420, '다시하기', 0x2255aa, 0x4488ff, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 420, '나가기', 0x884400, 0xffaa44, () => returnToScene(this, this.returnSceneKey));
  }

  createBtn(x, y, label, bg, border, callback) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(100, 255, 255, 255, false);
      this.time.delayedCall(100, callback);
    });
  }

  shutdown() {
    if (this.timerEvent) this.timerEvent.remove();
  }
}
