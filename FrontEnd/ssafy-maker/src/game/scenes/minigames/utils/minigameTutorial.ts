/**
 * 미니게임 튜토리얼 (How to Play) 화면 생성 유틸리티
 */

import Phaser from "phaser";
import { SCREEN, COLORS, PIXEL_FONT, TEXT_COLORS, FONT_SIZES } from "./minigameConstants";
import { createBackground, createPanel, createButton } from "./minigameUI";
import type { MinigameHowToPlay } from "../../../../features/minigame/minigameCatalog";

export interface MinigameTutorialConfig {
  title: string;
  howToPlay: MinigameHowToPlay;
  reward: string;
  onStart: () => void;
  onBack: () => void;
}

/**
 * 미니게임 시작 전 튜토리얼 화면을 표시합니다.
 *
 * @param scene Phaser 씬
 * @param config 튜토리얼 설정
 * @returns 튜토리얼 컨테이너 (destroy로 제거 가능)
 */
export function showMinigameTutorial(
  scene: Phaser.Scene,
  config: MinigameTutorialConfig
): Phaser.GameObjects.Container {
  const { title, howToPlay, reward, onStart, onBack } = config;

  // 컨테이너 생성
  const container = scene.add.container(0, 0);

  // 배경 (반투명 오버레이)
  const overlay = scene.add.rectangle(
    SCREEN.CENTER_X,
    SCREEN.CENTER_Y,
    SCREEN.W,
    SCREEN.H,
    COLORS.bgDark,
    0.95
  );
  container.add(overlay);

  // 메인 패널
  const panelWidth = 560;
  const panelHeight = 450;
  const panel = createPanel(
    scene,
    SCREEN.CENTER_X,
    SCREEN.CENTER_Y,
    panelWidth,
    panelHeight,
    {
      bgColor: COLORS.bgPanel,
      borderColor: COLORS.gold,
      borderWidth: 4,
    }
  );
  container.add(panel);

  // 상단 라인
  const topLine = scene.add.rectangle(
    SCREEN.CENTER_X,
    SCREEN.CENTER_Y - panelHeight / 2,
    panelWidth,
    4,
    COLORS.gold
  );
  container.add(topLine);

  // 제목
  const titleText = scene.add.text(
    SCREEN.CENTER_X,
    SCREEN.CENTER_Y - panelHeight / 2 + 30,
    title,
    {
      fontSize: "22px",
      color: TEXT_COLORS.gold,
      fontFamily: PIXEL_FONT,
    }
  ).setOrigin(0.5);
  container.add(titleText);

  // 구분선
  const divider = scene.add.rectangle(
    SCREEN.CENTER_X,
    SCREEN.CENTER_Y - panelHeight / 2 + 52,
    panelWidth - 50,
    2,
    COLORS.gold,
    0.4
  );
  container.add(divider);

  // 콘텐츠 영역 시작 Y
  let currentY = SCREEN.CENTER_Y - panelHeight / 2 + 70;
  const leftX = SCREEN.CENTER_X - panelWidth / 2 + 30;
  const lineHeight = 24;

  // 게임 방법 섹션
  const instructionsHeader = scene.add.text(
    leftX,
    currentY,
    "[ 게임 방법 ]",
    {
      fontSize: FONT_SIZES.lg,
      color: TEXT_COLORS.green,
      fontFamily: PIXEL_FONT,
    }
  ).setOrigin(0, 0.5);
  container.add(instructionsHeader);
  currentY += lineHeight + 4;

  howToPlay.instructions.forEach((instruction) => {
    const bullet = scene.add.text(
      leftX + 12,
      currentY,
      `• ${instruction}`,
      {
        fontSize: FONT_SIZES.md,
        color: TEXT_COLORS.white,
        fontFamily: PIXEL_FONT,
      }
    ).setOrigin(0, 0.5);
    container.add(bullet);
    currentY += lineHeight;
  });

  currentY += 8;

  // 조작법 섹션
  const controlsHeader = scene.add.text(
    leftX,
    currentY,
    "[ 조작법 ]",
    {
      fontSize: FONT_SIZES.lg,
      color: TEXT_COLORS.blue,
      fontFamily: PIXEL_FONT,
    }
  ).setOrigin(0, 0.5);
  container.add(controlsHeader);
  currentY += lineHeight + 4;

  howToPlay.controls.forEach((control) => {
    const bullet = scene.add.text(
      leftX + 12,
      currentY,
      `• ${control}`,
      {
        fontSize: FONT_SIZES.md,
        color: TEXT_COLORS.white,
        fontFamily: PIXEL_FONT,
      }
    ).setOrigin(0, 0.5);
    container.add(bullet);
    currentY += lineHeight;
  });

  // 팁 섹션 (옵션)
  if (howToPlay.tips && howToPlay.tips.length > 0) {
    currentY += 8;

    const tipsHeader = scene.add.text(
      leftX,
      currentY,
      "[ TIP ]",
      {
        fontSize: FONT_SIZES.lg,
        color: TEXT_COLORS.orange,
        fontFamily: PIXEL_FONT,
      }
    ).setOrigin(0, 0.5);
    container.add(tipsHeader);
    currentY += lineHeight + 4;

    howToPlay.tips.forEach((tip) => {
      const bullet = scene.add.text(
        leftX + 12,
        currentY,
        `• ${tip}`,
        {
          fontSize: FONT_SIZES.md,
          color: TEXT_COLORS.hint,
          fontFamily: PIXEL_FONT,
        }
      ).setOrigin(0, 0.5);
      container.add(bullet);
      currentY += lineHeight;
    });
  }

  // 보상 섹션 (하단 고정)
  const rewardY = SCREEN.CENTER_Y + panelHeight / 2 - 85;
  const rewardDivider = scene.add.rectangle(
    SCREEN.CENTER_X,
    rewardY - 15,
    panelWidth - 60,
    2,
    COLORS.gold,
    0.4
  );
  container.add(rewardDivider);

  const rewardHeader = scene.add.text(
    leftX,
    rewardY,
    "[ 보상 ]",
    {
      fontSize: FONT_SIZES.lg,
      color: TEXT_COLORS.gold,
      fontFamily: PIXEL_FONT,
    }
  ).setOrigin(0, 0.5);
  container.add(rewardHeader);

  const rewardText = scene.add.text(
    leftX + 12,
    rewardY + lineHeight,
    `• ${reward}`,
    {
      fontSize: FONT_SIZES.md,
      color: TEXT_COLORS.gold,
      fontFamily: PIXEL_FONT,
    }
  ).setOrigin(0, 0.5);
  container.add(rewardText);

  // 버튼 영역
  const buttonY = SCREEN.CENTER_Y + panelHeight / 2 - 28;

  // 시작하기 버튼
  const startBtn = createButton(
    scene,
    SCREEN.CENTER_X - 85,
    buttonY,
    "시작하기",
    onStart,
    {
      width: 140,
      height: 36,
      bgColor: 0x004422,
      hoverColor: COLORS.green,
      borderColor: COLORS.green,
      fontSize: FONT_SIZES.lg,
    }
  );
  container.add(startBtn.shadow!);
  container.add(startBtn.button);
  container.add(startBtn.text);

  // 돌아가기 버튼
  const backBtn = createButton(
    scene,
    SCREEN.CENTER_X + 85,
    buttonY,
    "돌아가기",
    onBack,
    {
      width: 140,
      height: 36,
      bgColor: 0x442222,
      hoverColor: COLORS.red,
      borderColor: COLORS.red,
      fontSize: FONT_SIZES.lg,
    }
  );
  container.add(backBtn.shadow!);
  container.add(backBtn.button);
  container.add(backBtn.text);

  // 컨테이너를 최상단에 배치
  container.setDepth(1000);

  return container;
}
