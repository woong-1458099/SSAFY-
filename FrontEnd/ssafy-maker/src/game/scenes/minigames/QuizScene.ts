// @ts-nocheck
import Phaser from 'phaser';
import { installMinigamePause } from './installMinigamePause';
import { applyLegacyViewport } from './viewport';
import { returnToScene } from '@features/minigame/minigameLauncher';
import { emitMinigameReward } from '@features/minigame/minigameRewardEvents';
import { LEGACY_QUIZ_SCENE_KEY } from '@features/minigame/minigameSceneKeys';
import {
  LEGACY_QUIZ_QUESTION_COUNT,
  LEGACY_QUIZ_QUESTIONS,
  LEGACY_QUIZ_TOTAL_TIME,
  resolveLegacyQuizResult
} from '@features/minigame/legacy/legacyQuizConfig';
import { SCREEN, PIXEL_FONT, COLORS, createBackground, createPanel, createButton } from './utils';
import { showMinigameTutorial } from './utils/minigameTutorial';
import { getMinigameCard } from '@features/minigame/minigameCatalog';

const { W, H } = SCREEN;

export default class QuizScene extends Phaser.Scene {
  private returnSceneKey = 'main';
  private completedRewardText = null;
  private rewardEmitted = false;
  private tutorialContainer = null;

  constructor() { super({ key: LEGACY_QUIZ_SCENE_KEY }); }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || 'main';
  }

  create() {
    applyLegacyViewport(this);
    installMinigamePause(this, this.returnSceneKey);

    // 튜토리얼 표시
    const catalogData = getMinigameCard(this.scene.key);
    if (catalogData?.howToPlay) {
      this.tutorialContainer = showMinigameTutorial(this, {
        title: catalogData.title,
        howToPlay: catalogData.howToPlay,
        reward: catalogData.reward,
        onStart: () => {
          this.tutorialContainer?.destroy();
          this.tutorialContainer = null;
          this.startGame();
        },
        onBack: () => {
          returnToScene(this, this.returnSceneKey);
        }
      });
    } else {
      this.startGame();
    }
  }

  startGame() {
    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = LEGACY_QUIZ_TOTAL_TIME;
    this.answered = false;
    this.completedRewardText = null;
    this.rewardEmitted = false;
    this.questions = Phaser.Utils.Array.Shuffle([...LEGACY_QUIZ_QUESTIONS]).slice(0, LEGACY_QUIZ_QUESTION_COUNT);

    // 배경
    this.add.rectangle(W / 2, H / 2, W, H, 0x0f1a2e);

    // 상단 헤더
    this.add.rectangle(W / 2, 40, W, 80, 0x162447);
    this.add.rectangle(W / 2, 0, W, 4, 0xFFD700);
    this.add.rectangle(W / 2, 80, W, 3, 0x4488ff);

    this.add.text(W / 2, 25, '📝 정보처리기사 퀴즈', {
      fontSize: '20px', color: '#FFD700', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.questionNum = this.add.text(30, 55, 'Q 1/8', {
      fontSize: '14px', color: '#88ccff', fontFamily: PIXEL_FONT
    });

    this.scoreText = this.add.text(W - 30, 55, 'SCORE: 0', {
      fontSize: '14px', color: '#00ff88', fontFamily: PIXEL_FONT
    }).setOrigin(1, 0);

    // 타이머 영역
    this.add.rectangle(W / 2, 105, W - 60, 20, 0x1a1a3e);
    this.timerBar = this.add.rectangle(30, 105, W - 60, 16, 0x00cc66).setOrigin(0, 0.5);
    this.timerText = this.add.text(W / 2, 105, `${LEGACY_QUIZ_TOTAL_TIME}`, {
      fontSize: '12px', color: '#ffffff', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    // 질문 박스
    this.add.rectangle(W / 2, 185, W - 40, 100, 0x1e3a5f).setStrokeStyle(3, 0x4488ff);
    this.questionText = this.add.text(W / 2, 185, '', {
      fontSize: '16px', color: '#ffffff', fontFamily: PIXEL_FONT,
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
        fontSize: '18px', color: '#ffffff', fontFamily: PIXEL_FONT
      }).setOrigin(0.5);

      const label = this.add.text(W / 2 + 20, y, '', {
        fontSize: '14px', color: '#ffffff', fontFamily: PIXEL_FONT,
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
      fontSize: '16px', color: '#FFD700', fontFamily: PIXEL_FONT
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
    this.timeLeft = LEGACY_QUIZ_TOTAL_TIME;
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
    this.timerText.setText(`${LEGACY_QUIZ_TOTAL_TIME}`);
  }

  tick() {
    if (this.answered) return;

    this.timeLeft--;
    this.timerText.setText(String(this.timeLeft));

    const ratio = this.timeLeft / LEGACY_QUIZ_TOTAL_TIME;
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
      fontSize: '24px', color: '#FFD700', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    const total = this.questions.length;
    const result = resolveLegacyQuizResult(this.score, total);
    this.completedRewardText = result.reward;

    this.add.text(W / 2, 220, `${this.score} / ${total}`, {
      fontSize: '48px', color: '#ffffff', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, result.grade, {
      fontSize: '20px', color: result.color, fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.add.text(W / 2, 340, result.reward, {
      fontSize: '14px', color: '#88ccff', fontFamily: PIXEL_FONT
    }).setOrigin(0.5);

    this.createBtn(W / 2 - 120, 420, '다시하기', 0x2255aa, 0x4488ff, () => this.scene.restart());
    this.createBtn(W / 2 + 120, 420, '나가기', 0x884400, 0xffaa44, () => {
      this.emitCompletedReward();
      returnToScene(this, this.returnSceneKey);
    });
  }

  createBtn(x, y, label, bg, border, callback) {
    this.add.rectangle(x + 2, y + 2, 180, 50, 0x000000, 0.5);
    const btn = this.add.rectangle(x, y, 180, 50, bg).setInteractive().setStrokeStyle(3, border);
    this.add.text(x, y, label, { fontSize: '14px', color: '#ffffff', fontFamily: PIXEL_FONT }).setOrigin(0.5);
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

  emitCompletedReward() {
    if (!this.completedRewardText || this.rewardEmitted) return;
    emitMinigameReward(this, { sceneKey: this.scene.key, rewardText: this.completedRewardText });
    this.rewardEmitted = true;
  }
}
