import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { createPanelOuterBorder } from "@features/ui/components/uiPrimitives";
import {
  getWeeklyPlanOption,
  getWeeklyPlanSlotIndex,
  WEEKLY_PLAN_DAY_INDICES,
  WEEKLY_PLAN_OPTIONS,
  WEEKLY_PLAN_TIME_LABELS,
  type WeeklyPlanOptionId,
} from "@features/planning/weeklyPlan";

type BodyStyleFn = (
  sizePx: number,
  color?: string,
  fontStyle?: "normal" | "bold"
) => Phaser.Types.GameObjects.Text.TextStyle;

type ActionButtonFn = (options: {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
}) => Phaser.GameObjects.Container;

export function createWeeklyPlannerModal(params: {
  scene: Phaser.Scene;
  week: number;
  dayLabels: readonly string[];
  initialPlan: WeeklyPlanOptionId[];
  getBodyStyle: BodyStyleFn;
  createActionButton: ActionButtonFn;
  uiPanelInnerBorderColor: number;
  uiPanelOuterBorderColor: number;
  onConfirm: (plan: WeeklyPlanOptionId[]) => void;
}): Phaser.GameObjects.Container {
  const {
    scene,
    week,
    dayLabels,
    initialPlan,
    getBodyStyle,
    createActionButton,
    uiPanelInnerBorderColor,
    uiPanelOuterBorderColor,
    onConfirm,
  } = params;

  const centerX = Math.round(GAME_CONSTANTS.WIDTH / 2);
  const centerY = Math.round(GAME_CONSTANTS.HEIGHT / 2);
  const overlay = scene.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.42);
  const panelOuter = createPanelOuterBorder(scene, centerX, centerY, 940, 600);
  panelOuter.setStrokeStyle(3, uiPanelOuterBorderColor, 1);
  const panel = scene.add.rectangle(centerX, centerY, 940, 600, 0x183657, 0.96);
  panel.setStrokeStyle(2, uiPanelInnerBorderColor, 1);

  const title = scene.add.text(centerX, centerY - 258, "주간 계획표", getBodyStyle(34, "#e6f3ff", "bold"));
  title.setOrigin(0.5);
  const subtitle = scene.add.text(
    centerX,
    centerY - 220,
    `${week}주차 월~금 오전/오후 일정을 선택하세요`,
    getBodyStyle(19, "#b6d6fb", "bold")
  );
  subtitle.setOrigin(0.5);

  const draftPlan = [...initialPlan];
  const slotObjects: Phaser.GameObjects.GameObject[] = [];
  const dayLabelX = centerX - 360;
  const amX = centerX - 104;
  const pmX = centerX + 204;
  const headerY = centerY - 170;
  const rowStartY = centerY - 118;
  const rowGap = 78;
  const slotWidth = 276;
  const slotHeight = 56;

  const amHeader = scene.add.text(amX, headerY, "오전 일정", getBodyStyle(20, "#dfefff", "bold"));
  amHeader.setOrigin(0.5);
  const pmHeader = scene.add.text(pmX, headerY, "오후 일정", getBodyStyle(20, "#dfefff", "bold"));
  pmHeader.setOrigin(0.5);
  slotObjects.push(amHeader, pmHeader);

  WEEKLY_PLAN_OPTIONS.forEach((option, index) => {
    const legend = scene.add.rectangle(centerX - 300 + index * 300, centerY + 188, 18, 18, option.color, 1);
    legend.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
    const legendText = scene.add.text(
      centerX - 268 + index * 300,
      centerY + 188,
      `${option.label} · ${option.description}`,
      getBodyStyle(15, "#d7e9ff", "bold")
    );
    legendText.setOrigin(0, 0.5);
    slotObjects.push(legend, legendText);
  });

  const refreshSlot = (
    bg: Phaser.GameObjects.Rectangle,
    badgeText: Phaser.GameObjects.Text,
    infoText: Phaser.GameObjects.Text,
    optionId: WeeklyPlanOptionId
  ) => {
    const option = getWeeklyPlanOption(optionId);
    bg.setFillStyle(option.color, 0.95);
    badgeText.setText(badgeText.text);
    infoText.setText(`${option.label}  |  ${option.description}`);
  };

  WEEKLY_PLAN_DAY_INDICES.forEach((dayIndex) => {
    const rowY = rowStartY + dayIndex * rowGap;
    const dayLabel = scene.add.text(dayLabelX, rowY, dayLabels[dayIndex] ?? "", getBodyStyle(22, "#f2f7ff", "bold"));
    dayLabel.setOrigin(0.5);
    slotObjects.push(dayLabel);

    WEEKLY_PLAN_TIME_LABELS.forEach((timeLabel, timeIndex) => {
      const x = timeIndex === 0 ? amX : pmX;
      const slotIndex = getWeeklyPlanSlotIndex(dayIndex, timeIndex);
      const bg = scene.add.rectangle(x, rowY, slotWidth, slotHeight, 0x2d5c8e, 0.95);
      bg.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
      bg.setInteractive({ useHandCursor: true });
      const badgeBg = scene.add.rectangle(x - slotWidth / 2 + 42, rowY, 58, 28, 0x133150, 0.96);
      badgeBg.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
      const badgeText = scene.add.text(x - slotWidth / 2 + 42, rowY, timeLabel, getBodyStyle(13, "#f4fbff", "bold"));
      badgeText.setOrigin(0.5);
      const infoText = scene.add.text(x - slotWidth / 2 + 82, rowY, "", getBodyStyle(15, "#f7fbff", "bold"));
      infoText.setOrigin(0, 0.5);

      refreshSlot(bg, badgeText, infoText, draftPlan[slotIndex]);
      bg.on("pointerdown", () => {
        const currentIndex = WEEKLY_PLAN_OPTIONS.findIndex((option) => option.id === draftPlan[slotIndex]);
        const nextIndex = (currentIndex + 1) % WEEKLY_PLAN_OPTIONS.length;
        draftPlan[slotIndex] = WEEKLY_PLAN_OPTIONS[nextIndex].id;
        refreshSlot(bg, badgeText, infoText, draftPlan[slotIndex]);
      });

      slotObjects.push(bg, badgeBg, badgeText, infoText);
    });
  });

  const confirmBtn = createActionButton({
    x: centerX,
    y: centerY + 258,
    width: 244,
    height: 56,
    text: "이번 주 계획 확정",
    onClick: () => onConfirm([...draftPlan]),
  });

  return scene.add.container(0, 0, [overlay, panelOuter, panel, title, subtitle, ...slotObjects, confirmBtn]);
}
