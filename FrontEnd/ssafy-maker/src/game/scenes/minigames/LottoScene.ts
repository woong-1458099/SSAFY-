// @ts-nocheck
import Phaser from "phaser";
import {
  LEGACY_LOTTO_GRID,
  LEGACY_LOTTO_PICK_COUNT,
  LEGACY_LOTTO_TOTAL_NUMBERS,
  getLegacyLottoBallColor
} from "@features/minigame/legacy/legacyLottoConfig";
import { LOTTO_COMPLETED_EVENT, rollLottoOutcome } from "@features/minigame/lottoOutcome";
import { returnToScene } from "@features/minigame/minigameLauncher";
import { LEGACY_LOTTO_SCENE_KEY } from "@features/minigame/minigameSceneKeys";
import { applyLegacyViewport } from "./viewport";
import { SCREEN, PIXEL_FONT, COLORS, createBackground, createButton } from './utils';
import { showMinigameTutorial } from './utils/minigameTutorial';
import { getMinigameCard } from '@features/minigame/minigameCatalog';

const { W, H } = SCREEN;

export default class LottoScene extends Phaser.Scene {
  private returnSceneKey = "main";
  private selectedNumbers = [];
  private drawnNumbers = [];
  private bonusNumber = 0;
  private isDrawing = false;
  private phase = "select";
  private pendingTimers = [];
  private numberButtons = [];
  private selectedBalls = [];
  private drawnBalls = [];
  private completedOutcome = null;
  private completedOutcomeEmitted = false;
  private tutorialContainer = null;

  constructor() {
    super({ key: LEGACY_LOTTO_SCENE_KEY });
  }

  init(data) {
    this.returnSceneKey = data?.returnSceneKey || "main";
  }

  resetRuntimeState() {
    this.selectedNumbers = [];
    this.drawnNumbers = [];
    this.bonusNumber = 0;
    this.isDrawing = false;
    this.phase = "select";
    this.pendingTimers = [];
    this.numberButtons = [];
    this.selectedBalls = [];
    this.drawnBalls = [];
    this.completedOutcome = null;
    this.completedOutcomeEmitted = false;
  }

  create() {
    this.resetRuntimeState();
    applyLegacyViewport(this);

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
    this.cameras.main.setBackgroundColor("#1a1a2e");
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    this.add.rectangle(W / 2, 0, W, 4, 0xffd700);

    this.add.text(W / 2, 30, "SSAFY LOTTO 6/45", {
      fontSize: "20px",
      color: "#ffd700",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    this.add.text(W / 2, 55, "구매 비용: 1,000 GP | 번호 6개 선택", {
      fontSize: "9px",
      color: "#88ccff",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    this.add.text(W / 2, 75, "5등 3,000G | 4등 20,000G | 3등 100,000G | 2등 1,000,000G | 1등 로또 엔딩", {
      fontSize: "7px",
      color: "#666688",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    this.createNumberGrid();
    this.createSelectedNumberDisplay();
    this.createDrawDisplay();
    this.createButtons();

    this.events.once("shutdown", this.shutdown, this);
    this.events.once("destroy", this.shutdown, this);
  }

  shutdown() {
    this.cleanup();
  }

  cleanup() {
    this.pendingTimers.forEach((timer) => {
      if (timer?.remove) timer.remove();
      else if (timer?.destroy) timer.destroy();
    });
    this.pendingTimers = [];
  }

  emitCompletedOutcome() {
    if (!this.completedOutcome || this.completedOutcomeEmitted) return;
    this.game.events.emit(LOTTO_COMPLETED_EVENT, this.completedOutcome);
    this.completedOutcomeEmitted = true;
  }

  completeAndReturn() {
    this.emitCompletedOutcome();
    this.cleanup();
    returnToScene(this, this.returnSceneKey);
  }

  createNumberGrid() {
    const { startX, startY, columns, spacing } = LEGACY_LOTTO_GRID;

    for (let num = 1; num <= LEGACY_LOTTO_TOTAL_NUMBERS; num += 1) {
      const col = (num - 1) % columns;
      const row = Math.floor((num - 1) / columns);
      const x = startX + col * spacing;
      const y = startY + row * 38;
      const color = getLegacyLottoBallColor(num);

      const ball = this.add.circle(x, y, 16, color, 0.3).setInteractive().setStrokeStyle(2, color);
      const txt = this.add.text(x, y, `${num}`, {
        fontSize: "10px",
        color: "#ffffff",
        fontFamily: PIXEL_FONT,
      }).setOrigin(0.5);

      ball.on("pointerdown", () => this.toggleNumber(num));
      ball.on("pointerover", () => {
        if (!this.selectedNumbers.includes(num)) {
          ball.setAlpha(0.8);
        }
      });
      ball.on("pointerout", () => {
        if (!this.selectedNumbers.includes(num)) {
          ball.setAlpha(0.3);
        }
      });

      this.numberButtons.push({ num, ball, txt });
    }
  }

  createSelectedNumberDisplay() {
    this.add.rectangle(W / 2, 340, 500, 60, 0x0d1545).setStrokeStyle(3, 0xffd700);
    this.add.text(160, 320, "선택 번호:", {
      fontSize: "10px",
      color: "#ffd700",
      fontFamily: PIXEL_FONT,
    });

    for (let i = 0; i < LEGACY_LOTTO_PICK_COUNT; i += 1) {
      const x = 250 + i * 55;
      const ball = this.add.circle(x, 340, 22, 0x333355).setStrokeStyle(2, 0x555577);
      const txt = this.add.text(x, 340, "", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: PIXEL_FONT,
      }).setOrigin(0.5);
      this.selectedBalls.push({ ball, txt });
    }
  }

  createDrawDisplay() {
    this.add.rectangle(W / 2, 420, 600, 80, 0x0d1545).setStrokeStyle(3, 0x44ff88);
    this.add.text(120, 395, "당첨 번호:", {
      fontSize: "10px",
      color: "#44ff88",
      fontFamily: PIXEL_FONT,
    });

    for (let i = 0; i < LEGACY_LOTTO_PICK_COUNT; i += 1) {
      const x = 220 + i * 50;
      const ball = this.add.circle(x, 420, 20, 0x222244);
      const txt = this.add.text(x, 420, "?", {
        fontSize: "11px",
        color: "#444466",
        fontFamily: PIXEL_FONT,
      }).setOrigin(0.5);
      this.drawnBalls.push({ ball, txt });
    }

    this.add.text(545, 420, "+", {
      fontSize: "14px",
      color: "#ff6688",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    this.bonusBall = this.add.circle(590, 420, 20, 0x222244);
    this.bonusTxt = this.add.text(590, 420, "?", {
      fontSize: "11px",
      color: "#444466",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    this.resultTxt = this.add.text(W / 2, 480, "", {
      fontSize: "14px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    this.matchTxt = this.add.text(W / 2, 510, "", {
      fontSize: "10px",
      color: "#88ccff",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);
  }

  createButtons() {
    this.createBtn(W / 2 - 150, 560, "자동 선택", 0x004466, 0x44aaff, () => this.autoSelect());
    this.purchaseBtn = this.createBtn(W / 2, 560, "구매하기 (1000GP)", 0x446600, 0x88ff44, () => this.purchase());
    this.createBtn(W / 2 + 150, 560, "초기화", 0x664400, 0xffaa44, () => this.resetSelection());

    this.exitBtn = this.add.text(30, H - 25, "EXIT", {
      fontSize: "10px",
      color: "#888888",
      fontFamily: PIXEL_FONT,
    }).setInteractive();
    this.exitBtn.on("pointerdown", () => {
      if (this.isDrawing) return;
      this.completeAndReturn();
    });
    this.exitBtn.on("pointerover", () => this.exitBtn.setColor("#ffffff"));
    this.exitBtn.on("pointerout", () => this.exitBtn.setColor("#888888"));
  }

  toggleNumber(num) {
    if (this.phase !== "select") return;

    const index = this.selectedNumbers.indexOf(num);
    const btnData = this.numberButtons.find((button) => button.num === num);
    if (!btnData) return;

    if (index >= 0) {
      this.selectedNumbers.splice(index, 1);
      btnData.ball.setAlpha(0.3);
      btnData.ball.setStrokeStyle(2, getLegacyLottoBallColor(num));
    } else if (this.selectedNumbers.length < LEGACY_LOTTO_PICK_COUNT) {
      this.selectedNumbers.push(num);
      btnData.ball.setAlpha(1);
      btnData.ball.setStrokeStyle(3, 0xffffff);
    }

    this.updateSelectedDisplay();
  }

  updateSelectedDisplay() {
    const sorted = [...this.selectedNumbers].sort((a, b) => a - b);

    for (let i = 0; i < LEGACY_LOTTO_PICK_COUNT; i += 1) {
      if (i < sorted.length) {
        const num = sorted[i];
        this.selectedBalls[i].ball.setFillStyle(getLegacyLottoBallColor(num));
        this.selectedBalls[i].ball.setStrokeStyle(2, 0xffffff);
        this.selectedBalls[i].txt.setText(`${num}`);
      } else {
        this.selectedBalls[i].ball.setFillStyle(0x333355);
        this.selectedBalls[i].ball.setStrokeStyle(2, 0x555577);
        this.selectedBalls[i].txt.setText("");
      }
    }
  }

  autoSelect() {
    if (this.phase !== "select") return;

    this.selectedNumbers.forEach((num) => {
      const btnData = this.numberButtons.find((button) => button.num === num);
      btnData?.ball.setAlpha(0.3);
      btnData?.ball.setStrokeStyle(2, getLegacyLottoBallColor(num));
    });

    this.selectedNumbers = [];
    const pool = Array.from({ length: LEGACY_LOTTO_TOTAL_NUMBERS }, (_, i) => i + 1);
    Phaser.Utils.Array.Shuffle(pool);
    pool.slice(0, LEGACY_LOTTO_PICK_COUNT).forEach((num) => {
      this.selectedNumbers.push(num);
      const btnData = this.numberButtons.find((button) => button.num === num);
      btnData?.ball.setAlpha(1);
      btnData?.ball.setStrokeStyle(3, 0xffffff);
    });

    this.updateSelectedDisplay();
  }

  resetSelection() {
    if (this.isDrawing) return;

    this.cleanup();
    this.phase = "select";
    this.completedOutcome = null;
    this.completedOutcomeEmitted = false;

    this.selectedNumbers.forEach((num) => {
      const btnData = this.numberButtons.find((button) => button.num === num);
      if (btnData) {
        btnData.ball.setAlpha(0.3);
        btnData.ball.setStrokeStyle(2, getLegacyLottoBallColor(num));
      }
    });

    this.selectedNumbers = [];
    this.drawnNumbers = [];
    this.bonusNumber = 0;
    this.updateSelectedDisplay();

    this.drawnBalls.forEach(({ ball, txt }) => {
      ball.setFillStyle(0x222244);
      ball.setStrokeStyle(0);
      txt.setText("?").setColor("#444466");
    });

    this.bonusBall.setFillStyle(0x222244);
    this.bonusBall.setStrokeStyle(0);
    this.bonusTxt.setText("?").setColor("#444466");
    this.resultTxt.setText("");
    this.matchTxt.setText("");
  }

  purchase() {
    if (this.phase !== "select" || this.isDrawing) return;

    if (this.selectedNumbers.length !== LEGACY_LOTTO_PICK_COUNT) {
      this.resultTxt.setText("번호 6개를 모두 선택해 주세요!").setColor("#ff6666");
      return;
    }

    this.phase = "drawing";
    this.isDrawing = true;
    this.completedOutcome = rollLottoOutcome();

    const drawResult = this.buildDrawResult(this.completedOutcome);
    this.drawnNumbers = drawResult.drawnNumbers;
    this.bonusNumber = drawResult.bonusNumber;

    this.resultTxt.setText("추첨 중...").setColor("#ffff88");
    this.matchTxt.setText("");

    this.animateDraw();
  }

  buildDrawResult(outcome) {
    const allNumbers = Array.from({ length: LEGACY_LOTTO_TOTAL_NUMBERS }, (_, i) => i + 1);
    const selected = [...this.selectedNumbers].sort((a, b) => a - b);
    const selectedSet = new Set(selected);
    const unselected = allNumbers.filter((num) => !selectedSet.has(num));
    Phaser.Utils.Array.Shuffle(unselected);

    const matched = Phaser.Utils.Array.Shuffle([...selected]).slice(0, outcome.matchCount);
    const misses = unselected.slice(0, LEGACY_LOTTO_PICK_COUNT - matched.length);
    const drawnNumbers = [...matched, ...misses].sort((a, b) => a - b);

    let bonusNumber = allNumbers.find((num) => !drawnNumbers.includes(num)) ?? 1;
    if (outcome.bonusMatch) {
      bonusNumber = selected.find((num) => !matched.includes(num)) ?? bonusNumber;
    } else {
      const bonusPool = allNumbers.filter((num) => !drawnNumbers.includes(num) && !selectedSet.has(num));
      Phaser.Utils.Array.Shuffle(bonusPool);
      bonusNumber = bonusPool[0] ?? bonusNumber;
    }

    return {
      drawnNumbers,
      bonusNumber,
    };
  }

  animateDraw() {
    this.drawnNumbers.forEach((num, index) => {
      const timer = this.time.delayedCall(600 + index * 500, () => {
        if (!this.scene.isActive()) return;

        const color = getLegacyLottoBallColor(num);
        this.drawnBalls[index].ball.setFillStyle(color);
        this.drawnBalls[index].txt.setText(`${num}`).setColor("#ffffff");

        if (this.selectedNumbers.includes(num)) {
          this.drawnBalls[index].ball.setStrokeStyle(3, 0xffffff);
          this.cameras.main.shake(100, 0.008);
        }

        this.cameras.main.flash(50, 255, 255, 255);
      });
      this.pendingTimers.push(timer);
    });

    const bonusTimer = this.time.delayedCall(600 + LEGACY_LOTTO_PICK_COUNT * 500, () => {
      if (!this.scene.isActive()) return;

      const color = getLegacyLottoBallColor(this.bonusNumber);
      this.bonusBall.setFillStyle(color);
      this.bonusTxt.setText(`${this.bonusNumber}`).setColor("#ffffff");
      if (this.selectedNumbers.includes(this.bonusNumber)) {
        this.bonusBall.setStrokeStyle(3, 0xff6688);
      }
      this.cameras.main.flash(100, 255, 200, 100);
    });
    this.pendingTimers.push(bonusTimer);

    const resultTimer = this.time.delayedCall(600 + (LEGACY_LOTTO_PICK_COUNT + 1) * 500, () => {
      if (!this.scene.isActive()) return;
      this.showResult();
    });
    this.pendingTimers.push(resultTimer);
  }

  showResult() {
    if (!this.scene.isActive()) return;

    this.isDrawing = false;
    this.phase = "result";

    const outcome = this.completedOutcome ?? rollLottoOutcome();
    const matchCount = this.selectedNumbers.filter((num) => this.drawnNumbers.includes(num)).length;
    const bonusMatch = this.selectedNumbers.includes(this.bonusNumber);

    if (outcome.celebration === "big") {
      this.celebrate(true);
    } else if (outcome.celebration === "small") {
      this.celebrate(false);
    }

    this.resultTxt.setText(outcome.title).setColor(outcome.color);
    this.matchTxt.setText(`일치: ${matchCount}개${bonusMatch ? " (+보너스)" : ""} | ${outcome.rewardText}`);

    const sorted = [...this.selectedNumbers].sort((a, b) => a - b);
    sorted.forEach((num, index) => {
      const isMatch = this.drawnNumbers.includes(num);
      const isBonusMatch = num === this.bonusNumber;

      if (isMatch) {
        this.selectedBalls[index].ball.setStrokeStyle(4, 0x00ff00);
      } else if (isBonusMatch) {
        this.selectedBalls[index].ball.setStrokeStyle(4, 0xff6688);
      }
    });

    if (outcome.isJackpot) {
      const timer = this.time.delayedCall(1400, () => {
        if (!this.scene.isActive()) return;
        this.completeAndReturn();
      });
      this.pendingTimers.push(timer);
    }
  }

  celebrate(big) {
    const count = big ? 40 : 15;
    const colors = [0xffd700, 0xff6688, 0x88ff88, 0x88ccff, 0xff88ff];

    for (let i = 0; i < count; i += 1) {
      const star = this.add.star(
        Phaser.Math.Between(50, W - 50),
        Phaser.Math.Between(100, H - 100),
        5,
        4,
        8,
        Phaser.Utils.Array.GetRandom(colors)
      );

      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(800, 1500),
        onComplete: () => {
          if (star?.active) star.destroy();
        },
      });
    }

    if (big) {
      this.cameras.main.shake(500, 0.015);
      this.cameras.main.flash(300, 255, 215, 0);
    } else {
      this.cameras.main.shake(200, 0.008);
    }
  }

  createBtn(x, y, label, bg, border, cb) {
    this.add.rectangle(x + 2, y + 2, 140, 36, 0x000000, 0.4);
    const btn = this.add.rectangle(x, y, 140, 36, bg).setInteractive().setStrokeStyle(2, border);
    this.add.text(x, y, label, {
      fontSize: "8px",
      color: "#ffffff",
      fontFamily: PIXEL_FONT,
    }).setOrigin(0.5);

    btn.on("pointerover", () => btn.setFillStyle(border));
    btn.on("pointerout", () => btn.setFillStyle(bg));
    btn.on("pointerdown", () => {
      this.cameras.main.flash(50, 255, 255, 255);
      cb();
    });

    return btn;
  }
}
