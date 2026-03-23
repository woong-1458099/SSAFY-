/**
 * 레거시 미니게임 공통 UI 생성 함수
 */

import Phaser from "phaser";
import { SCREEN, COLORS, PIXEL_FONT, TEXT_COLORS, FONT_SIZES } from "./minigameConstants";
import { TEXT_STYLES } from "./minigameStyles";

/**
 * 전체 화면 배경 생성
 */
export function createBackground(
  scene: Phaser.Scene,
  color: number = COLORS.bgDark
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(
    SCREEN.CENTER_X,
    SCREEN.CENTER_Y,
    SCREEN.W,
    SCREEN.H,
    color
  );
}

/**
 * 그리드 패턴 배경 생성
 */
export function createGridBackground(
  scene: Phaser.Scene,
  gridSize: number = 40,
  color: number = 0x2a2a4e,
  alpha: number = 0.3
): Phaser.GameObjects.Graphics {
  const grid = scene.add.graphics();
  grid.lineStyle(1, color, alpha);

  for (let x = 0; x < SCREEN.W; x += gridSize) {
    grid.lineBetween(x, 0, x, SCREEN.H);
  }
  for (let y = 0; y < SCREEN.H; y += gridSize) {
    grid.lineBetween(0, y, SCREEN.W, y);
  }

  return grid;
}

/**
 * 상단 헤더 UI 생성
 */
export function createHeader(
  scene: Phaser.Scene,
  title: string,
  options: {
    height?: number;
    bgColor?: number;
    accentColor?: number;
    titleColor?: string;
  } = {}
): {
  bg: Phaser.GameObjects.Rectangle;
  topLine: Phaser.GameObjects.Rectangle;
  bottomLine: Phaser.GameObjects.Rectangle;
  titleText: Phaser.GameObjects.Text;
} {
  const {
    height = 70,
    bgColor = COLORS.bgPanel,
    accentColor = COLORS.gold,
    titleColor = TEXT_COLORS.gold,
  } = options;

  const centerY = height / 2;

  const bg = scene.add.rectangle(SCREEN.CENTER_X, centerY, SCREEN.W, height, bgColor, 0.95);
  const topLine = scene.add.rectangle(SCREEN.CENTER_X, 0, SCREEN.W, 4, accentColor);
  const bottomLine = scene.add.rectangle(SCREEN.CENTER_X, height, SCREEN.W, 3, accentColor);

  const titleText = scene.add.text(SCREEN.CENTER_X, centerY - 10, title, {
    fontSize: FONT_SIZES.xl,
    color: titleColor,
    fontFamily: PIXEL_FONT,
  }).setOrigin(0.5);

  return { bg, topLine, bottomLine, titleText };
}

/**
 * 패널 (박스) 생성
 */
export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    bgColor?: number;
    borderColor?: number;
    borderWidth?: number;
    alpha?: number;
  } = {}
): Phaser.GameObjects.Rectangle {
  const {
    bgColor = COLORS.bgPanel,
    borderColor = COLORS.gold,
    borderWidth = 3,
    alpha = 1,
  } = options;

  const panel = scene.add.rectangle(x, y, width, height, bgColor, alpha);
  panel.setStrokeStyle(borderWidth, borderColor);

  return panel;
}

/**
 * 버튼 생성
 */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: {
    width?: number;
    height?: number;
    bgColor?: number;
    hoverColor?: number;
    borderColor?: number;
    textColor?: string;
    fontSize?: string;
    withShadow?: boolean;
  } = {}
): {
  shadow?: Phaser.GameObjects.Rectangle;
  button: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
} {
  const {
    width = 180,
    height = 50,
    bgColor = COLORS.bgPanel,
    hoverColor = COLORS.blue,
    borderColor = COLORS.gold,
    textColor = TEXT_COLORS.white,
    fontSize = FONT_SIZES.md,
    withShadow = true,
  } = options;

  let shadow: Phaser.GameObjects.Rectangle | undefined;
  if (withShadow) {
    shadow = scene.add.rectangle(x + 2, y + 2, width, height, COLORS.black, 0.5);
  }

  const button = scene.add
    .rectangle(x, y, width, height, bgColor)
    .setInteractive({ useHandCursor: true })
    .setStrokeStyle(3, borderColor);

  const text = scene.add.text(x, y, label, {
    fontSize,
    color: textColor,
    fontFamily: PIXEL_FONT,
  }).setOrigin(0.5);

  button.on("pointerover", () => button.setFillStyle(hoverColor));
  button.on("pointerout", () => button.setFillStyle(bgColor));
  button.on("pointerdown", () => {
    scene.cameras.main.flash(100, 255, 255, 255, false);
    scene.time.delayedCall(100, onClick);
  });

  return { shadow, button, text };
}

/**
 * 점수 텍스트 생성
 */
export function createScoreText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  initialScore: number = 0,
  prefix: string = "SCORE: "
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, `${prefix}${initialScore}`, TEXT_STYLES.score);
}

/**
 * 타이머 텍스트 생성
 */
export function createTimerText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  initialTime: number,
  prefix: string = "TIME: "
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, `${prefix}${initialTime}`, TEXT_STYLES.timer).setOrigin(1, 0);
}

/**
 * 타이머 바 생성
 */
export function createTimerBar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number = 16,
  options: {
    bgColor?: number;
    fillColor?: number;
  } = {}
): {
  bg: Phaser.GameObjects.Rectangle;
  bar: Phaser.GameObjects.Rectangle;
  update: (percent: number) => void;
} {
  const { bgColor = 0x1a1a3e, fillColor = COLORS.green } = options;

  const bg = scene.add.rectangle(x + width / 2, y, width, height + 4, bgColor);
  const bar = scene.add.rectangle(x, y, width, height, fillColor).setOrigin(0, 0.5);

  const update = (percent: number) => {
    bar.setScale(Math.max(0, Math.min(1, percent)), 1);
  };

  return { bg, bar, update };
}

/**
 * 결과 화면 생성
 */
export function createResultScreen(
  scene: Phaser.Scene,
  options: {
    title?: string;
    score: number;
    grade: string;
    gradeColor: string;
    message: string;
    reward: string;
    onRestart: () => void;
    onExit: () => void;
  }
): void {
  const {
    title = "게임 종료",
    score,
    grade,
    gradeColor,
    message,
    reward,
    onRestart,
    onExit,
  } = options;

  // 배경 초기화
  scene.children.removeAll();
  createBackground(scene);

  // 상단 라인
  scene.add.rectangle(SCREEN.CENTER_X, 0, SCREEN.W, 4, COLORS.gold);

  // 결과 패널
  createPanel(scene, SCREEN.CENTER_X, SCREEN.CENTER_Y, 500, 380, {
    borderColor: COLORS.gold,
    borderWidth: 4,
  });

  // 제목
  scene.add.text(SCREEN.CENTER_X, 150, title, TEXT_STYLES.title).setOrigin(0.5);

  // 점수
  scene.add.text(SCREEN.CENTER_X - 50, 220, `${score}`, TEXT_STYLES.bigNumber).setOrigin(0.5);

  // 등급
  scene.add.text(SCREEN.CENTER_X + 80, 220, grade, {
    fontSize: "48px",
    color: gradeColor,
    fontFamily: PIXEL_FONT,
  }).setOrigin(0.5);

  // 메시지
  scene.add.text(SCREEN.CENTER_X, 290, message, {
    fontSize: FONT_SIZES.lg,
    color: gradeColor,
    fontFamily: PIXEL_FONT,
  }).setOrigin(0.5);

  // 보상
  scene.add.text(SCREEN.CENTER_X, 340, `보상: ${reward}`, TEXT_STYLES.reward).setOrigin(0.5);

  // 버튼
  createButton(scene, SCREEN.CENTER_X - 110, 420, "다시하기", onRestart, {
    bgColor: 0x004422,
    hoverColor: COLORS.green,
    borderColor: COLORS.green,
  });

  createButton(scene, SCREEN.CENTER_X + 110, 420, "나가기", onExit, {
    bgColor: 0x222244,
    hoverColor: COLORS.blue,
    borderColor: 0x6666aa,
  });
}

/**
 * 판정 텍스트 표시 (Perfect, Good, Miss 등)
 */
export function showJudgeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = TEXT_COLORS.gold,
  duration: number = 600
): Phaser.GameObjects.Text {
  const judgeText = scene.add.text(x, y, text, {
    fontSize: FONT_SIZES.xxl,
    color,
    fontFamily: PIXEL_FONT,
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: judgeText,
    y: y - 30,
    alpha: 0,
    duration,
    onComplete: () => judgeText.destroy(),
  });

  return judgeText;
}

/**
 * 점수 획득 이펙트
 */
export function showScorePopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  points: number,
  color: string = TEXT_COLORS.green
): void {
  const popup = scene.add.text(x, y, `+${points}`, {
    fontSize: FONT_SIZES.lg,
    color,
    fontFamily: PIXEL_FONT,
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: popup,
    y: y - 50,
    alpha: 0,
    duration: 600,
    onComplete: () => popup.destroy(),
  });
}

/**
 * 파티클 효과 (성공 시)
 */
export function showParticleEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  count: number = 8,
  color: number = COLORS.green
): void {
  for (let i = 0; i < count; i++) {
    const particle = scene.add.rectangle(
      x + Phaser.Math.Between(-20, 20),
      y,
      4,
      4,
      color
    );

    scene.tweens.add({
      targets: particle,
      x: particle.x + Phaser.Math.Between(-60, 60),
      y: particle.y + Phaser.Math.Between(-40, 40),
      alpha: 0,
      duration: 400,
      onComplete: () => particle.destroy(),
    });
  }
}
