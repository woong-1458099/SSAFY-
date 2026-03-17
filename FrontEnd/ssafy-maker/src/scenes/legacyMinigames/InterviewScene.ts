import Phaser from 'phaser';
import { applyLegacyViewport } from './viewport';
import { installMinigamePause } from './installMinigamePause';

const PF = '"Press Start 2P"';

const QUESTIONS = [
  {
    question: 'REST API에서 PUT과 PATCH의 차이는?',
    options: [
      'PUT은 전체 수정, PATCH는 부분 수정',
      'PUT은 삭제, PATCH는 수정',
      'PUT은 조회, PATCH는 생성',
      '둘 다 동일한 기능이다',
    ],
    answer: 0,
    category: 'WEB',
  },
  {
    question: 'HTTP 상태코드 401과 403의 차이는?',
    options: [
      '401은 서버 오류, 403은 클라이언트 오류',
      '401은 인증 없음, 403은 권한 없음',
      '401은 찾을 수 없음, 403은 요청 오류',
      '둘 다 인증 오류이다',
    ],
    answer: 1,
    category: 'WEB',
  },
  {
    question: 'React에서 useEffect의 두 번째 인자 []의 의미는?',
    options: [
      '컴포넌트가 업데이트될 때마다 실행',
      '컴포넌트가 언마운트될 때만 실행',
      '컴포넌트가 마운트될 때 한 번만 실행',
      '아무것도 실행하지 않음',
    ],
    answer: 2,
    category: 'FE',
  },
  {
    question: 'SQL에서 INNER JOIN과 LEFT JOIN의 차이는?',
    options: [
      'INNER는 왼쪽 테이블만, LEFT는 오른쪽 테이블만',
      'INNER는 교집합, LEFT는 왼쪽 테이블 전체 포함',
      'INNER는 합집합, LEFT는 교집합',
      '둘 다 동일한 결과를 반환한다',
    ],
    answer: 1,
    category: 'DB',
  },
  {
    question: 'Git에서 merge와 rebase의 차이는?',
    options: [
      'merge는 커밋 이력 유지, rebase는 이력 재정렬',
      'merge는 브랜치 삭제, rebase는 브랜치 생성',
      'merge는 로컬용, rebase는 원격용',
      '둘 다 동일한 기능이다',
    ],
    answer: 0,
    category: 'GIT',
  },
  {
    question: 'OOP의 4대 특성이 아닌 것은?',
    options: [
      '캡슐화',
      '상속',
      '동기화',
      '다형성',
    ],
    answer: 2,
    category: 'CS',
  },
  {
    question: 'Spring Boot에서 @Autowired의 역할은?',
    options: [
      'HTTP 요청을 매핑한다',
      '의존성을 자동으로 주입한다',
      '트랜잭션을 관리한다',
      '예외를 처리한다',
    ],
    answer: 1,
    category: 'BE',
  },
  {
    question: 'TCP와 UDP의 차이로 올바른 것은?',
    options: [
      'TCP는 빠르고 UDP는 신뢰성이 높다',
      'TCP는 신뢰성 보장, UDP는 빠르지만 비신뢰성',
      'TCP는 비연결형, UDP는 연결형',
      '둘 다 동일한 전송 방식이다',
    ],
    answer: 1,
    category: 'CS',
  },
  {
    question: 'Docker에서 이미지와 컨테이너의 관계는?',
    options: [
      '이미지는 실행 중인 인스턴스, 컨테이너는 템플릿',
      '둘 다 동일한 개념이다',
      '이미지는 템플릿, 컨테이너는 실행 중인 인스턴스',
      '이미지는 네트워크, 컨테이너는 스토리지',
    ],
    answer: 2,
    category: 'INFRA',
  },
  {
    question: 'JavaScript에서 == 와 === 의 차이는?',
    options: [
      '== 는 타입까지 비교, === 는 값만 비교',
      '== 는 값만 비교, === 는 타입과 값 모두 비교',
      '둘 다 동일하게 동작한다',
      '== 는 객체 비교, === 는 원시값 비교',
    ],
    answer: 1,
    category: 'FE',
  },
];

const CATEGORY_COLORS: Record<string, number> = {
  WEB:   0x4499ff,
  FE:    0x44ff88,
  BE:    0xff8800,
  DB:    0xcc55ff,
  GIT:   0xff4466,
  CS:    0xFFD700,
  INFRA: 0x33ffcc,
};

export default class InterviewScene extends Phaser.Scene {
  private score = 0;
  private currentQ = 0;
  private timeLeft = 15;
  private answered = false;
  private questions: typeof QUESTIONS = [];
  private timerEvent!: Phaser.Time.TimerEvent;

  private scoreTxt!: Phaser.GameObjects.Text;
  private timerTxt!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private questionTxt!: Phaser.GameObjects.Text;
  private categoryBadge!: Phaser.GameObjects.Rectangle;
  private categoryTxt!: Phaser.GameObjects.Text;
  private optionBtns: Phaser.GameObjects.Rectangle[] = [];
  private resultTxt!: Phaser.GameObjects.Text;
  private progressTxt!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'InterviewScene' });
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this);

    const W = 800, H = 600;

    // 문제 5개 랜덤 선택
    this.questions = Phaser.Utils.Array.Shuffle([...QUESTIONS]).slice(0, 5);
    this.currentQ = 0;
    this.score = 0;

    // 배경
    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);

    // 그리드
    for (let x = 0; x < W; x += 40) {
      this.add.rectangle(x, H/2, 1, H, 0x112233, 0.3);
    }
    for (let y = 0; y < H; y += 40) {
      this.add.rectangle(W/2, y, W, 1, 0x112233, 0.3);
    }

    // 상단 HUD
    this.add.rectangle(W/2, 25, W, 50, 0x0d1545, 0.95);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);
    this.add.rectangle(W/2, 50, W, 3, 0xFFD700);

    this.add.text(W/2, 10, 'TECH INTERVIEW', {
      fontSize: '14px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5, 0);

    this.scoreTxt = this.add.text(20, 12, 'SCORE: 0', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    });

    this.timerTxt = this.add.text(W - 20, 12, 'TIME: 15', {
      fontSize: '9px', color: '#ff4466', fontFamily: PF
    }).setOrigin(1, 0);

    this.progressTxt = this.add.text(W/2, 38, '1 / 5', {
      fontSize: '8px', color: '#888888', fontFamily: PF
    }).setOrigin(0.5, 0);

    // 타이머 바
    this.add.rectangle(W/2, 47, W - 40, 5, 0x333355);
    this.timerBar = this.add.rectangle(20, 47, W - 40, 5, 0xff4466).setOrigin(0, 0.5);

    // 카테고리 배지
    this.categoryBadge = this.add.rectangle(W/2, 85, 120, 28, 0x4499ff);
    this.categoryTxt = this.add.text(W/2, 85, 'WEB', {
      fontSize: '9px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    // 질문 박스
    this.add.rectangle(W/2 + 3, 183, 724, 114, 0x000000, 0.8);
    this.add.rectangle(W/2, 180, 724, 110, 0x0d1545)
      .setStrokeStyle(3, 0xFFD700);

    this.questionTxt = this.add.text(W/2, 180, '', {
      fontSize: '11px', color: '#ffffff', fontFamily: PF,
      wordWrap: { width: 660 }, align: 'center'
    }).setOrigin(0.5);

    // 결과 텍스트
    this.resultTxt = this.add.text(W/2, 555, '', {
      fontSize: '11px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5).setDepth(10);

    this.loadQuestion();

    // 타이머
    this.timerEvent = this.time.addEvent({
      delay: 1000, loop: true,
      callback: this.tick, callbackScope: this
    });
  }

  loadQuestion() {
    const W = 800;

    this.answered = false;
    this.timeLeft = 15;
    this.timerTxt.setText('TIME: 15');
    this.timerBar.setScale(1, 1).setFillStyle(0xff4466);
    this.resultTxt.setText('');

    const q = this.questions[this.currentQ];
    const catColor = CATEGORY_COLORS[q.category] ?? 0x4499ff;

    // 카테고리 배지
    this.categoryBadge.setFillStyle(catColor);
    this.categoryTxt.setText(q.category);

    // 진행도
    this.progressTxt.setText(`${this.currentQ + 1} / 5`);

    // 질문
    this.questionTxt.setText(q.question);

    // 보기 버튼 초기화
    this.optionBtns.forEach(btn => btn.destroy());
    this.optionBtns = [];
    this.children.list
      .filter(c => (c as any).__isOption)
      .forEach(c => c.destroy());

    const optionColors = [0x001888, 0x005518, 0x440088, 0x881100];
    const borderColors = [0x4499ff, 0x33ff88, 0xcc55ff, 0xff4466];

    q.options.forEach((opt, i) => {
      const y = 290 + i * 68;
      const bg = optionColors[i];
      const border = borderColors[i];

      // 그림자
      const shadow = this.add.rectangle(W/2 + 3, y + 3, 700, 58, 0x000000, 0.8);
      (shadow as any).__isOption = true;

      const btn = this.add.rectangle(W/2, y, 700, 54, bg)
        .setInteractive()
        .setStrokeStyle(3, border);
      (btn as any).__isOption = true;

      // 번호 배지
      const numBadge = this.add.rectangle(W/2 - 320, y, 36, 36, border);
      (numBadge as any).__isOption = true;
      const numTxt = this.add.text(W/2 - 320, y, String(i + 1), {
        fontSize: '10px', color: '#ffffff', fontFamily: PF
      }).setOrigin(0.5);
      (numTxt as any).__isOption = true;

      const txt = this.add.text(W/2 + 10, y, opt, {
        fontSize: '8px', color: '#ffffff', fontFamily: PF,
        wordWrap: { width: 580 }, align: 'left'
      }).setOrigin(0, 0.5);
      (txt as any).__isOption = true;

      btn.on('pointerover', () => {
        if (!this.answered) btn.setFillStyle(border);
      });
      btn.on('pointerout', () => {
        if (!this.answered) btn.setFillStyle(bg);
      });
      btn.on('pointerdown', () => this.selectAnswer(i, btn, border, bg, txt));

      this.optionBtns.push(btn);
    });
  }

  selectAnswer(
    idx: number,
    btn: Phaser.GameObjects.Rectangle,
    border: number,
    bg: number,
    txt: Phaser.GameObjects.Text
  ) {
    if (this.answered) return;
    this.answered = true;

    const q = this.questions[this.currentQ];
    const isCorrect = idx === q.answer;

    if (isCorrect) {
      this.score += 100;
      this.scoreTxt.setText(`SCORE: ${this.score}`);
      btn.setFillStyle(0x00aa44).setStrokeStyle(3, 0x44ff88);
      txt.setColor('#44ff88');
      this.resultTxt.setColor('#44ff88').setText('✅ CORRECT! +100');
      this.cameras.main.flash(150, 0, 255, 100, false);
    } else {
      btn.setFillStyle(0xaa0000).setStrokeStyle(3, 0xff4466);
      txt.setColor('#ff4466');
      // 정답 표시
      const correctBtn = this.optionBtns[q.answer];
      correctBtn.setFillStyle(0x00aa44).setStrokeStyle(3, 0x44ff88);
      this.resultTxt.setColor('#ff4466').setText('❌ WRONG...');
      this.cameras.main.shake(200, 0.006);
    }

    this.time.delayedCall(1200, () => {
      this.currentQ++;
      if (this.currentQ >= 5) {
        this.endGame();
      } else {
        this.loadQuestion();
      }
    });
  }

  tick() {
    if (this.answered) return;
    this.timeLeft--;
    this.timerTxt.setText(`TIME: ${this.timeLeft}`);

    const ratio = this.timeLeft / 15;
    this.timerBar.setScale(ratio, 1);
    if (ratio < 0.3) this.timerBar.setFillStyle(0xff4466);
    else if (ratio < 0.6) this.timerBar.setFillStyle(0xffaa00);
    else this.timerBar.setFillStyle(0x4499ff);

    if (this.timeLeft <= 0) {
      this.answered = true;
      this.resultTxt.setColor('#ff4466').setText('⏰ TIME UP!');
      // 정답 표시
      const q = this.questions[this.currentQ];
      this.optionBtns[q.answer]?.setFillStyle(0x00aa44).setStrokeStyle(3, 0x44ff88);
      this.cameras.main.shake(200, 0.006);

      this.time.delayedCall(1200, () => {
        this.currentQ++;
        if (this.currentQ >= 5) {
          this.endGame();
        } else {
          this.loadQuestion();
        }
      });
    }
  }

  endGame() {
    this.timerEvent.remove();
    this.children.removeAll();

    const W = 800, H = 600;

    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1f);
    this.add.rectangle(W/2, 4, W, 6, 0xFFD700);

    this.add.rectangle(W/2 + 3, H/2 + 3, 640, 420, 0x000000, 0.8);
    this.add.rectangle(W/2, H/2, 640, 420, 0x0d1545);
    this.add.rectangle(W/2, H/2 - 208, 640, 4, 0xFFD700);
    this.add.rectangle(W/2, H/2 + 208, 640, 4, 0xFFD700);
    this.add.rectangle(W/2 - 318, H/2, 4, 420, 0xFFD700);
    this.add.rectangle(W/2 + 318, H/2, 4, 420, 0xFFD700);

    this.add.text(W/2, 115, 'TECH INTERVIEW', {
      fontSize: '16px', color: '#FFD700', fontFamily: PF
    }).setOrigin(0.5);
    this.add.text(W/2, 148, 'RESULT', {
      fontSize: '9px', color: '#888888', fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 210, `${this.score}`, {
      fontSize: '48px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);

    const correct = this.score / 100;

    let grade, gradeColor, msg, reward;
    if (correct === 5) {
      grade = 'S'; gradeColor = '#FFD700';
      msg = '🏆 PERFECT! 면접 통과!';
      reward = 'INT +10    GP +30';
    } else if (correct >= 4) {
      grade = 'A'; gradeColor = '#00ff88';
      msg = '✅ 합격권!';
      reward = 'INT +7    GP +20';
    } else if (correct >= 3) {
      grade = 'B'; gradeColor = '#4499ff';
      msg = '😤 아슬아슬...';
      reward = 'INT +5    GP +10';
    } else {
      grade = 'C'; gradeColor = '#ff4466';
      msg = '😅 공부가 필요해요';
      reward = 'STRESS +5';
    }

    this.add.text(W/2 + 200, 215, grade, {
      fontSize: '70px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    this.add.text(W/2, 275, msg, {
      fontSize: '10px', color: gradeColor, fontFamily: PF
    }).setOrigin(0.5);

    const stats = [
      { label: 'CORRECT',  value: `${correct} / 5`,  color: '#44ff88' },
      { label: 'SCORE',    value: this.score,          color: '#ffffff' },
      { label: 'REWARD',   value: reward,              color: '#FFD700' },
    ];

    stats.forEach((s, i) => {
      this.add.text(W/2 - 180, 325 + i * 40, s.label, {
        fontSize: '8px', color: '#888888', fontFamily: PF
      }).setOrigin(0, 0.5);
      this.add.text(W/2 + 180, 325 + i * 40, String(s.value), {
        fontSize: '9px', color: s.color, fontFamily: PF
      }).setOrigin(1, 0.5);
    });

    this.add.text(W/2, 455, 'TIP: SSAFY 기술 스택 위주로 출제됩니다!', {
      fontSize: '6px', color: '#445566', fontFamily: PF
    }).setOrigin(0.5);

    this.createBtn(270, 500, 'RETRY', 0x001888, 0x4499ff, () => this.scene.restart());
    this.createBtn(530, 500, 'MENU',  0x440088, 0xcc55ff, () => this.scene.start('MenuScene'));
  }

  createBtn(x: number, y: number, label: string, bg: number, border: number, cb: () => void) {
    this.add.rectangle(x + 3, y + 3, 200, 48, 0x000000, 0.8);
    const btn = this.add.rectangle(x, y, 200, 44, bg)
      .setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, {
      fontSize: '12px', color: '#ffffff', fontFamily: PF
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(border));
    btn.on('pointerout', () => btn.setFillStyle(bg));
    btn.on('pointerdown', () => {
      this.cameras.main.flash(150, 255, 255, 255, false);
      this.time.delayedCall(150, cb);
    });
  }
}