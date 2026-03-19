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

const FIXED_EVENT_SLOT_COLOR = 0x7a4268;
const FIXED_EVENT_BADGE_COLOR = 0x321631;

export function createWeeklyPlannerModal(params: {
  scene: Phaser.Scene;
  week: number;
  dayLabels: readonly string[];
  initialPlan: WeeklyPlanOptionId[];
  completedSlotIndices?: ReadonlySet<number>;
  fixedEventSlots?: ReadonlyMap<number, string>;
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
    fixedEventSlots,
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

  const title = scene.add.text(centerX, centerY - 258, "\uC8FC\uAC04 \uACC4\uD68D\uD45C", getBodyStyle(34, "#e6f3ff", "bold"));
  title.setOrigin(0.5);
  const subtitle = scene.add.text(
    centerX - 62,
    centerY - 220,
    `${week}\uC8FC\uCC28 \uD3C9\uC77C \uC624\uC804/\uC624\uD6C4 \uC77C\uC815\uC744 \uC120\uD0DD\uD558\uC138\uC694`,
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

  const amHeader = scene.add.text(amX, headerY, "\uC624\uC804 \uC77C\uC815", getBodyStyle(20, "#dfefff", "bold"));
  amHeader.setOrigin(0.5);
  const pmHeader = scene.add.text(pmX, headerY, "\uC624\uD6C4 \uC77C\uC815", getBodyStyle(20, "#dfefff", "bold"));
  pmHeader.setOrigin(0.5);
  slotObjects.push(amHeader, pmHeader);

  const legendEntries = [
    ...WEEKLY_PLAN_OPTIONS.map((option) => ({
      color: option.color,
      label: `${option.label} | ${option.description}`,
    })),
    {
      color: FIXED_EVENT_SLOT_COLOR,
      label: "\uC774\uBCA4\uD2B8 | \uACE0\uC815 \uC774\uBCA4\uD2B8\uB85C \uBCC0\uACBD \uBD88\uAC00",
    },
  ];

  legendEntries.forEach((entry, index) => {
    const legendY = centerY - 252 + index * 28;
    const legend = scene.add.rectangle(centerX + 205, legendY, 18, 18, entry.color, 1);
    legend.setStrokeStyle(2, uiPanelInnerBorderColor, 1);
    const legendText = scene.add.text(centerX + 225, legendY, entry.label, getBodyStyle(15, "#d7e9ff", "bold"));
    legendText.setOrigin(0, 0.5);
    slotObjects.push(legend, legendText);
  });

  const refreshSlot = (
    bg: Phaser.GameObjects.Rectangle,
    badgeBg: Phaser.GameObjects.Rectangle,
    badgeText: Phaser.GameObjects.Text,
    infoText: Phaser.GameObjects.Text,
    optionId: WeeklyPlanOptionId,
    completed: boolean,
    fixedEventName?: string
  ): void => {
    const option = getWeeklyPlanOption(optionId);
    const baseBadgeText = badgeText.text.replace(" \uC644\uB8CC", "").replace(" \uC774\uBCA4\uD2B8", "");
    const isFixedEvent = typeof fixedEventName === "string" && fixedEventName.trim().length > 0;

    if (isFixedEvent) {
      bg.setFillStyle(FIXED_EVENT_SLOT_COLOR, 0.96);
      badgeBg.setFillStyle(FIXED_EVENT_BADGE_COLOR, 0.98);
      badgeText.setText(`${baseBadgeText} \uC774\uBCA4\uD2B8`);
      infoText.setText(`${fixedEventName}  |  \uACE0\uC815 \uC774\uBCA4\uD2B8`);
      bg.disableInteractive();
      return;
    }

    bg.setFillStyle(completed ? 0x4c5f76 : option.color, completed ? 0.82 : 0.95);
    badgeBg.setFillStyle(completed ? 0x22384f : 0x133150, 0.96);
    badgeText.setText(completed ? `${baseBadgeText} \uC644\uB8CC` : baseBadgeText);
    infoText.setText(completed ? `${option.label}  |  \uC644\uB8CC` : `${option.label}  |  ${option.description}`);
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
      const fixedEventName = fixedEventSlots?.get(slotIndex);
      refreshSlot(bg, badgeBg, badgeText, infoText, draftPlan[slotIndex], completed, fixedEventName);
      bg.on("pointerdown", () => {
        if (completedSlotIndices?.has(slotIndex) || fixedEventSlots?.has(slotIndex)) {
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
    text: "\uC774\uBC88 \uC8FC \uACC4\uD68D \uD655\uC815",
    onClick: () => onConfirm([...draftPlan]),
  });

  const root = scene.add.container(0, 0, [overlay, panelOuter, panel, title, subtitle, ...slotObjects, confirmBtn]);
  root.setScrollFactor(0);
  return root;
}
