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
  completedSlotIndices?: ReadonlySet<number>;
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
    completedSlotIndices,
    getBodyStyle,
    createActionButton,
    uiPanelInnerBorderColor,
    uiPanelOuterBorderColor,
    onConfirm,
  } = params;

  const centerX = Math.round(GAME_CONSTANTS.WIDTH / 2);
  const centerY = Math.round(GAME_CONSTANTS.HEIGHT / 2);
  const panelWidth = 940;
  const panelHeight = 600;
  const overlay = scene.add.rectangle(centerX, centerY, GAME_CONSTANTS.WIDTH, GAME_CONSTANTS.HEIGHT, 0x000000, 0.42);
  const panelOuter = createPanelOuterBorder(scene, centerX, centerY, panelWidth, panelHeight);
  panelOuter.setStrokeStyle(3, uiPanelOuterBorderColor, 1);
  const panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x183657, 0.96);
  panel.setStrokeStyle(2, uiPanelInnerBorderColor, 1);

  const title = scene.add.text(centerX, centerY - 258, "주간 계획표", getBodyStyle(34, "#e6f3ff", "bold"));
  title.setOrigin(0.5);
  const subtitle = scene.add.text(
    centerX - 54,
    centerY - 220,
    `${week}주차 평일 오전/오후 일정을 선택하세요`,
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
    const legendY = centerY - 252 + index * 28;
    const legend = scene.add.rectangle(centerX + 205, legendY, 18, 18, option.color, 1);
    legend.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
    const legendText = scene.add.text(
      centerX + 225,
      legendY,
      `${option.label} | ${option.description}`,
      getBodyStyle(15, "#d7e9ff", "bold")
    );
    legendText.setOrigin(0, 0.5);
    slotObjects.push(legend, legendText);
  });

  const refreshSlot = (
    bg: Phaser.GameObjects.Rectangle,
    badgeBg: Phaser.GameObjects.Rectangle,
    badgeText: Phaser.GameObjects.Text,
    infoText: Phaser.GameObjects.Text,
    optionId: WeeklyPlanOptionId,
    completed: boolean
  ) => {
    const option = getWeeklyPlanOption(optionId);
    bg.setFillStyle(completed ? 0x4c5f76 : option.color, completed ? 0.82 : 0.95);
    badgeBg.setFillStyle(completed ? 0x22384f : 0x133150, 0.96);
    badgeText.setText(completed ? `${badgeText.text.replace(" 완료", "")} 완료` : badgeText.text.replace(" 완료", ""));
    infoText.setText(completed ? `${option.label}  |  완료` : `${option.label}  |  ${option.description}`);
    bg.disableInteractive();
    if (!completed) {
      bg.setInteractive({ useHandCursor: true });
    }
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
      const badgeBg = scene.add.rectangle(x - slotWidth / 2 + 42, rowY, 58, 28, 0x133150, 0.96);
      badgeBg.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
      const badgeText = scene.add.text(x - slotWidth / 2 + 42, rowY, timeLabel, getBodyStyle(13, "#f4fbff", "bold"));
      badgeText.setOrigin(0.5);
      const infoText = scene.add.text(x - slotWidth / 2 + 82, rowY, "", getBodyStyle(15, "#f7fbff", "bold"));
      infoText.setOrigin(0, 0.5);

      const completed = completedSlotIndices?.has(slotIndex) ?? false;
      refreshSlot(bg, badgeBg, badgeText, infoText, draftPlan[slotIndex], completed);
      bg.on("pointerdown", () => {
        if (completedSlotIndices?.has(slotIndex)) {
          return;
        }
        const currentIndex = WEEKLY_PLAN_OPTIONS.findIndex((option) => option.id === draftPlan[slotIndex]);
        const nextIndex = (currentIndex + 1) % WEEKLY_PLAN_OPTIONS.length;
        draftPlan[slotIndex] = WEEKLY_PLAN_OPTIONS[nextIndex].id;
        refreshSlot(bg, badgeBg, badgeText, infoText, draftPlan[slotIndex], false);
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
