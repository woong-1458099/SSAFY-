// @ts-nocheck
import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import { installMinigamePause } from './installMinigamePause';

const PF = '"Press Start 2P"';
const W = 800;
const H = 600;

const QUESTIONS = [
  {
    question: 'REST API에서 PUT과 PATCH의 차이는?',
    options: ['PUT: 전체 수정, PATCH: 부분 수정', 'PUT: 삭제, PATCH: 수정', 'PUT: 조회, PATCH: 생성', '둘 다 동일한 기능'],
    answer: 0, category: 'WEB'
  },
  {
    question: 'HTTP 상태코드 401과 403의 차이는?',
    options: ['401: 서버 오류, 403: 클라이언트 오류', '401: 인증 없음, 403: 권한 없음', '401: 찾을 수 없음, 403: 요청 오류', '둘 다 인증 오류'],
    answer: 1, category: 'WEB'
  },
  {
    question: 'React useEffect의 빈 배열 []의 의미는?',
    options: ['업데이트마다 실행', '언마운트 시만 실행', '마운트 시 한 번만 실행', '아무것도 실행 안함'],
    answer: 2, category: 'FE'
  },
  {
    question: 'SQL INNER JOIN과 LEFT JOIN 차이는?',
    options: ['INNER: 왼쪽만, LEFT: 오른쪽만', 'INNER: 교집합, LEFT: 왼쪽 전체 포함', 'INNER: 합집합, LEFT: 교집합', '둘 다 동일한 결과'],
    answer: 1, category: 'DB'
  },
  {
    question: 'Git merge와 rebase의 차이는?',
    options: ['merge: 이력 유지, rebase: 이력 재정렬', 'merge: 브랜치 삭제, rebase: 브랜치 생성', 'merge: 로컬용, rebase: 원격용', '둘 다 동일한 기능'],
    answer: 0, category: 'GIT'
  },
  {
    question: 'OOP 4대 특성이 아닌 것은?',
    options: ['캡슐화', '상속', '동기화', '다형성'],
    answer: 2, category: 'CS'
  },
  {
    question: 'Spring @Autowired의 역할은?',
    options: ['HTTP 요청 매핑', '의존성 자동 주입', '트랜잭션 관리', '예외 처리'],
    answer: 1, category: 'BE'
  },
  {
    question: 'TCP와 UDP의 차이는?',
    options: ['TCP: 빠름, UDP: 신뢰성', 'TCP: 신뢰성, UDP: 빠름', 'TCP: 비연결형, UDP: 연결형', '둘 다 동일한 방식'],
    answer: 1, category: 'CS'
  },
  {
    question: 'Docker 이미지와 컨테이너의 관계는?',
    options: ['이미지: 실행 인스턴스, 컨테이너: 템플릿', '둘 다 동일한 개념', '이미지: 템플릿, 컨테이너: 실행 인스턴스', '이미지: 네트워크, 컨테이너: 스토리지'],
    answer: 2, category: 'INFRA'
  },
  {
    question: 'JavaScript == 와 === 차이는?',
    options: ['==: 타입+값, ===: 값만', '==: 값만, ===: 타입+값 모두', '둘 다 동일하게 동작', '==: 객체, ===: 원시값'],
    answer: 1, category: 'FE'
  },
];

const CATEGORY_COLORS = {
  WEB: 0x4499ff, FE: 0x44ff88, BE: 0xff8800,
  DB: 0xcc55ff, GIT: 0xff4466, CS: 0xFFD700, INFRA: 0x33ffcc
};

export default class InterviewScene extends Phaser.Scene {
  constructor() { super({ key: 'InterviewScene' }); }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    this.questions = Phaser.Utils.Array.Shuffle([...QUESTIONS]).slice(0, 5);
    this.currentQ = 0;
    this.score = 0;
    this.timeLeft = 20;
    this.answered = false;

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);

    // 상단 HUD
    this.add.rectangle(W / 2, 40, W, 80, 0x0d1545);
    this.add.rectangle(W / 2, 0, W, 4, 0xFFD700);
    this.add.rectangle(W / 2, 80, W, 3, 0xFFD700);

    this.add.text(W / 2, 20, '💼 기술 면접', {
      fontSize: '22px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.scoreTxt = this.add.text(30, 55, 'SCORE: 0', {
      fontSize: '14px', color: '#00ff88', fontFamily: PF
    });

    this.progressTxt = this.add.text(W / 2, 55, '1 / 5', {
      fontSize: '14px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    this.timerTxt = this.add.text(W - 30, 55, '20', {
      fontSize: '14px', color: '#ff4466', fontFamily: PF
    }).setOrigin(1, 0);

    // 타이머 바
    this.add.rectangle(W / 2, 95, W - 60, 14, 0x1a1a3e);
    this.timerBar = this.add.rectangle(30, 95, W - 60, 10, 0xff4466).setOrigin(0, 0.5);

    // 카테고리 배지
    this.categoryBadge = this.add.rectangle(W / 2, 130, 100, 30, 0x4499ff);
    this.categoryTxt = this.add.text(W / 2, 130, 'WEB', {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 질문 박스
    this.add.rectangle(W / 2, 195, W - 40, 90, 0x0d1545).setStrokeStyle(3, 0xFFD700);
    this.questionTxt = this.add.text(W / 2, 195, '', {
      fontSize: '15px', color: '#ffffff', fontFamily: PF,
      wordWrap: { width: W - 100 }, align: 'center', lineSpacing: 6
    }).setOrigin(0.5);

    // 결과 텍스트
    this.resultTxt = this.add.text(W / 2, H - 25, '', {
      fontSize: '16px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5).setDepth(10);

    // 옵션 영역 (나중에 loadQuestion에서 생성)
    this.optionBtns = [];

    this.loadQuestion();

    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true, callback: this.tick, callbackScope: this
    });
  }

  loadQuestion() {
    this.answered = false;
    this.timeLeft = 20;
    this.timerTxt.setText('20').setColor('#ff4466');
    this.timerBar.setScale(1, 1).setFillStyle(0xff4466);
    this.resultTxt.setText('');

    const q = this.questions[this.currentQ];
    const catColor = CATEGORY_COLORS[q.category] || 0x4499ff;

    this.categoryBadge.setFillStyle(catColor);
    this.categoryTxt.setText(q.category);
    this.progressTxt.setText(`${this.currentQ + 1} / 5`);
    this.questionTxt.setText(q.question);

    // 기존 옵션 제거
    this.optionBtns.forEach(btn => btn.destroy());
    this.optionBtns = [];
    this.children.list.filter(c => c.__isOption).forEach(c => c.destroy());

    const optionColors = [0x002266, 0x004422, 0x442200, 0x440022];
    const borderColors = [0x4499ff, 0x44ff88, 0xff8800, 0xff4466];

    q.options.forEach((opt, i) => {
      const y = 280 + i * 72;

      // 그림자
      const shadow = this.add.rectangle(W / 2 + 3, y + 3, W - 60, 60, 0x000000, 0.6);
      shadow.__isOption = true;

      const btn = this.add.rectangle(W / 2, y, W - 60, 56, optionColors[i])
        .setInteractive()
        .setStrokeStyle(3, borderColors[i]);
      btn.__isOption = true;

      // 번호 배지
      const numBadge = this.add.rectangle(55, y, 40, 40, borderColors[i]);
      numBadge.__isOption = true;

      const numTxt = this.add.text(55, y, String(i + 1), {
        fontSize: '16px', color: '#ffffff', fontFamily: PF
      }).setOrigin(0.5);
      numTxt.__isOption = true;

      const txt = this.add.text(W / 2 + 20, y, opt, {
        fontSize: '13px', color: '#ffffff', fontFamily: PF,
        wordWrap: { width: W - 180 }, align: 'center'
      }).setOrigin(0.5);
      txt.__isOption = true;

      btn.on('pointerover', () => {
        if (!this.answered) {
          btn.setFillStyle(borderColors[i]);
          this.tweens.add({ targets: btn, scaleX: 1.02, scaleY: 1.02, duration: 80 });
        }
      });
      btn.on('pointerout', () => {
        if (!this.answered) {
          btn.setFillStyle(optionColors[i]);
          this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 });
        }
      });
      btn.on('pointerdown', () => this.selectAnswer(i, btn, txt));

      this.optionBtns.push(btn);
      btn.__txt = txt;
    });
  }

  selectAnswer(idx, btn, txt) {
    if (this.answered) return;
    this.answered = true;

    const q = this.questions[this.currentQ];
    const isCorrect = idx === q.answer;

    // 모든 버튼 비활성화
    this.optionBtns.forEach((b, i) => {
      b.disableInteractive();
      if (i === q.answer) {
        b.setFillStyle(0x00aa44).setStrokeStyle(3, 0x44ff88);
        b.__txt.setColor('#44ff88');
      } else if (i === idx && !isCorrect) {
        b.setFillStyle(0xaa0000).setStrokeStyle(3, 0xff4466);
        b.__txt.setColor('#ff4466');
      } else {
        b.setFillStyle(0x222233);
        b.__txt.setColor('#666666');
      }
    });

    if (isCorrect) {
      this.score += 100;
      this.scoreTxt.setText(`SCORE: ${this.score}`);
      this.resultTxt.setColor('#44ff88').setText('✅ 정답! +100');
      this.cameras.main.flash(150, 0, 255, 100, false);
    } else {
      this.resultTxt.setColor('#ff4466').setText('❌ 오답...');
      this.cameras.main.shake(200, 0.008);
    }

    this.time.delayedCall(1300, () => {
      this.currentQ++;
      if (this.currentQ >= 5) this.endGame();
      else this.loadQuestion();
    });
  }

  tick() {
    if (this.answered) return;

    this.timeLeft--;
    this.timerTxt.setText(String(this.timeLeft));

    const ratio = this.timeLeft / 20;
    this.timerBar.setScale(ratio, 1);

    if (ratio < 0.25) {
      this.timerBar.setFillStyle(0xff4466);
      this.timerTxt.setColor('#ff4466');
    } else if (ratio < 0.5) {
      this.timerBar.setFillStyle(0xffaa00);
      this.timerTxt.setColor('#ffaa00');
    } else {
      this.timerBar.setFillStyle(0x4499ff);
      this.timerTxt.setColor('#4499ff');
    }

    if (this.timeLeft <= 0) {
      this.answered = true;
      this.resultTxt.setColor('#ff4466').setText('⏰ 시간 초과!');

      const q = this.questions[this.currentQ];
      this.optionBtns[q.answer]?.setFillStyle(0x00aa44).setStrokeStyle(3, 0x44ff88);
      this.optionBtns[q.answer]?.__txt?.setColor('#44ff88');

      this.cameras.main.shake(200, 0.006);

      this.time.delayedCall(1300, () => {
        this.currentQ++;
        if (this.currentQ >= 5) this.endGame();
        else this.loadQuestion();
      });
    }
  }

  endGame() {
    this.timerEvent.remove();
    this.children.removeAll();

    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1f);
    this.add.rectangle(W / 2, 0, W, 4, 0xFFD700);

    // 결과 박스
    this.add.rectangle(W / 2, H / 2, 520, 400, 0x0d1545).setStrokeStyle(4, 0xFFD700);

    this.add.text(W / 2, 130, '💼 면접 결과', {
      fontSize: '24px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    const correct = this.score / 100;

    this.add.text(W / 2, 200, `${this.score}`, {
      fontSize: '56px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    let grade, gradeColor, msg, reward;
    if (correct === 5) {
      grade = 'S';
      gradeColor = '#FFD700';
      msg = '🏆 PERFECT! 면접 합격!';
      reward = '지능 +10, GP +30';
    } else if (correct >= 4) {
      grade = 'A';
      gradeColor = '#00ff88';
      msg = '✅ 합격권!';
      reward = '지능 +7, GP +20';
    } else if (correct >= 3) {
      grade = 'B';
      gradeColor = '#4499ff';
      msg = '😤 아슬아슬...';
      reward = '지능 +5, GP +10';
    } else {
      grade = 'C';
      gradeColor = '#ff4466';
      msg = '📚 공부가 필요해요';
      reward = '스트레스 +5';
    }

    this.add.text(W / 2 + 160, 200, grade, {
      fontSize: '56px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 270, msg, {
      fontSize: '14px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 320, `정답: ${correct} / 5`, {
      fontSize: '14px', color: '#88ccff', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W / 2, 360, reward, {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(W / 2 - 120, 440, '다시하기', 0x002266, 0x4499ff, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 440, '메뉴', 0x440066, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PF }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(100, 255, 255, 255, false);
      this.time.delayedCall(100, cb);
    });
  }

  shutdown() {
    if (this.timerEvent) this.timerEvent.remove();
  }
}
