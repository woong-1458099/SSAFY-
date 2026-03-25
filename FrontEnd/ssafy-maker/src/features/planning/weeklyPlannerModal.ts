import Phaser from "phaser";
import { UI_DEPTH } from "../../game/systems/uiDepth";
import {
  getWeeklyPlanOption,
  getWeeklyPlanSlotIndex,
  WEEKLY_PLAN_DAY_INDICES,
  WEEKLY_PLAN_OPTIONS,
  WEEKLY_PLAN_TIME_LABELS,
  type WeeklyPlanOptionId
} from "./weeklyPlan";

const FONT_FAMILY =
  "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";
const FIXED_EVENT_SLOT_COLOR = 0x5e3654;
const SLOT_BADGE_HORIZONTAL_PADDING = 10;
const SLOT_CONTENT_LEFT_PADDING = 14;
const SLOT_CONTENT_RIGHT_PADDING = 16;
const SLOT_CONTENT_GAP = 12;

export function createWeeklyPlannerModal(scene: Phaser.Scene, options: {
  week: number;
  dayLabels: readonly string[];
  currentDayLabel: string;
  currentTimeLabel: string;
  actionPoint: number;
  maxActionPoint: number;
  fixedEventSlots?: ReadonlyMap<number, string>;
  completedSlotIndices?: ReadonlySet<number>;
  initialPlan: WeeklyPlanOptionId[];
  onConfirm: (plan: WeeklyPlanOptionId[]) => void;
  onAdvance: (plan: WeeklyPlanOptionId[]) => void;
}): Phaser.GameObjects.Container {
  const { week, dayLabels, currentDayLabel, currentTimeLabel, actionPoint, maxActionPoint, fixedEventSlots, completedSlotIndices, initialPlan, onConfirm, onAdvance } =
    options;

  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const panelWidth = 1100;
  const panelHeight = 640;
  const root = scene.add.container(0, 0).setDepth(UI_DEPTH.planner).setScrollFactor(0);
  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.62).setScrollFactor(0);
  const panelOuter = scene.add.rectangle(centerX, centerY, panelWidth + 8, panelHeight + 8, 0x000000, 0).setScrollFactor(0);
  panelOuter.setStrokeStyle(2, 0x3b6a92, 1);
  const panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x14314f, 0.97).setScrollFactor(0);
  panel.setStrokeStyle(3, 0x8ed2ff, 1);
  const title = scene.add.text(centerX, centerY - 282, "주간 계획표", {
    fontFamily: FONT_FAMILY,
    fontSize: "34px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);
  const subtitle = scene.add.text(
    centerX,
    centerY - 242,
    `${week}주차 | 현재 ${currentDayLabel} ${currentTimeLabel} | 행동력 ${actionPoint}/${maxActionPoint}`,
    {
      fontFamily: FONT_FAMILY,
      fontSize: "18px",
      color: "#a9d0f4",
      resolution: 2
    }
  ).setOrigin(0.5).setScrollFactor(0);

  const draftPlan = [...initialPlan];
  const objects: Phaser.GameObjects.GameObject[] = [overlay, panelOuter, panel, title, subtitle];
  const contentWidth = panelWidth - 100;
  const gridColumnGap = 22;
  const minGridColumnGap = 12;
  const legendGap = 38;
  const minLegendGap = 16;
  const dayColumnWidth = 78;
  const slotWidth = 280;
  const slotHeight = 70;
  const legendPanelWidth = 280;
  const legendPanelHeight = 346;
  const legendPaddingX = 18;
  const legendPaddingTop = 24;
  const legendTitleGap = 28;
  const legendRowHeight = 64;
  const fixedColumnWidth = dayColumnWidth + slotWidth * 2 + legendPanelWidth;
  const desiredGapBudget = gridColumnGap * 2 + legendGap;
  const minimumGapBudget = minGridColumnGap * 2 + minLegendGap;
  const availableGapBudget = Math.max(0, contentWidth - fixedColumnWidth);
  const gapBudget = Math.max(minimumGapBudget, availableGapBudget);
  let effectiveGridColumnGap = gridColumnGap;
  let effectiveLegendGap = legendGap;

  const excessGap = Math.max(0, desiredGapBudget - gapBudget);
  if (excessGap > 0) {
    const legendReduction = Math.min(excessGap, effectiveLegendGap - minLegendGap);
    effectiveLegendGap -= legendReduction;

    const remainingExcess = excessGap - legendReduction;
    if (remainingExcess > 0) {
      const perColumnReduction = Math.min(
        effectiveGridColumnGap - minGridColumnGap,
        Math.ceil(remainingExcess / 2)
      );
      effectiveGridColumnGap -= perColumnReduction;
    }

    console.warn("[weeklyPlannerModal] planner grid exceeded content width, reduced gaps to keep modal visible.", {
      contentWidth,
      fixedColumnWidth,
      desiredGapBudget,
      effectiveGridColumnGap,
      effectiveLegendGap
    });
  }

  const plannerGridWidth =
    fixedColumnWidth + effectiveGridColumnGap * 2 + effectiveLegendGap;
  const plannerGridLeft = centerX - plannerGridWidth / 2;
  const dayColumnRightX = plannerGridLeft + dayColumnWidth;
  const amX = dayColumnRightX + effectiveGridColumnGap + slotWidth / 2;
  const pmX = amX + slotWidth / 2 + effectiveGridColumnGap + slotWidth / 2;
  const legendPanelX = pmX + slotWidth / 2 + effectiveLegendGap + legendPanelWidth / 2;
  const headerY = centerY - 180;
  const rowStartY = centerY - 126;
  const rowGap = 84;
  const slotInfoWidth = slotWidth - 112;
  const legendPanelY = centerY + 12;

  const amHeader = scene.add.text(amX, headerY, "오전 일정", {
    fontFamily: FONT_FAMILY,
    fontSize: "20px",
    fontStyle: "bold",
    color: "#dfefff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);
  const pmHeader = scene.add.text(pmX, headerY, "오후 일정", {
    fontFamily: FONT_FAMILY,
    fontSize: "20px",
    fontStyle: "bold",
    color: "#dfefff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);
  objects.push(amHeader, pmHeader);

  const badgeMeasureText = scene.add.text(-1000, -1000, "", {
    fontFamily: FONT_FAMILY,
    fontSize: "13px",
    fontStyle: "bold",
    color: "#f4fbff",
    resolution: 2
  });
  const slotBadgeBaseWidth = Math.max(
    ...WEEKLY_PLAN_TIME_LABELS.map((label) => {
      badgeMeasureText.setText(`${label} 이벤트`);
      return badgeMeasureText.width + SLOT_BADGE_HORIZONTAL_PADDING * 2;
    })
  );
  badgeMeasureText.destroy();

  const refreshSlot = (
    slotIndex: number,
    bg: Phaser.GameObjects.Rectangle,
    badgeBg: Phaser.GameObjects.Rectangle,
    badgeText: Phaser.GameObjects.Text,
    infoText: Phaser.GameObjects.Text,
    completionBadge: Phaser.GameObjects.Arc,
    completionText: Phaser.GameObjects.Text,
    optionId: WeeklyPlanOptionId,
    fixedEventName?: string
  ): void => {
    const option = getWeeklyPlanOption(optionId);
    const isFixedEvent = typeof fixedEventName === "string" && fixedEventName.trim().length > 0;
    const isCompleted = completedSlotIndices?.has(slotIndex) === true;

    const updateSlotLayout = () => {
      const badgeWidth = Math.max(slotBadgeBaseWidth, badgeText.width + SLOT_BADGE_HORIZONTAL_PADDING * 2);
      const slotLeftX = bg.x - bg.width / 2;
      const badgeCenterX = slotLeftX + SLOT_CONTENT_LEFT_PADDING + badgeWidth / 2;
      const infoX = slotLeftX + SLOT_CONTENT_LEFT_PADDING + badgeWidth + SLOT_CONTENT_GAP;
      const infoWidth = Math.max(
        72,
        bg.width - SLOT_CONTENT_LEFT_PADDING - SLOT_CONTENT_RIGHT_PADDING - badgeWidth - SLOT_CONTENT_GAP
      );

      badgeBg.setSize(badgeWidth, badgeBg.height);
      badgeBg.setPosition(badgeCenterX, bg.y);
      badgeText.setPosition(badgeCenterX, bg.y);
      infoText.setPosition(infoX, bg.y);
      infoText.setWordWrapWidth(infoWidth);
      completionBadge.setPosition(bg.x + bg.width / 2 - 24, bg.y - bg.height / 2 + 22);
      completionText.setPosition(completionBadge.x, completionBadge.y - 1);
    };

    if (isFixedEvent) {
      bg.setFillStyle(isCompleted ? 0x4d2640 : FIXED_EVENT_SLOT_COLOR, 0.96);
      bg.setStrokeStyle(2, isCompleted ? 0xffdced : 0xffaacb, 1);
      badgeBg.setFillStyle(0x321631, 0.98);
      badgeText.setText(`${badgeText.text.replace(" 이벤트", "")} 이벤트`);
      infoText.setText(`${fixedEventName}\n고정 이벤트`);
      completionBadge.setVisible(isCompleted);
      completionText.setVisible(isCompleted);
      updateSlotLayout();
      bg.disableInteractive();
      return;
    }

    bg.setFillStyle(isCompleted ? Phaser.Display.Color.IntegerToColor(option.color).darken(28).color : option.color, 0.95);
    bg.setStrokeStyle(2, isCompleted ? 0xeaf6ff : 0x8ed2ff, 1);
    badgeBg.setFillStyle(0x133150, 0.96);
    badgeText.setText(badgeText.text.replace(" 이벤트", ""));
    infoText.setText(`${option.label}\n${option.description}`);
    completionBadge.setVisible(isCompleted);
    completionText.setVisible(isCompleted);
    updateSlotLayout();
    bg.disableInteractive();
    if (!isCompleted) {
      bg.setInteractive({ useHandCursor: true });
    }
  };

  WEEKLY_PLAN_DAY_INDICES.forEach((dayIndex) => {
    const rowY = rowStartY + dayIndex * rowGap;
    const dayLabel = scene.add.text(dayColumnRightX, rowY, dayLabels[dayIndex] ?? "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    }).setOrigin(1, 0.5).setScrollFactor(0);
    objects.push(dayLabel);

    WEEKLY_PLAN_TIME_LABELS.forEach((timeLabel, timeIndex) => {
      const x = timeIndex === 0 ? amX : pmX;
      const slotIndex = getWeeklyPlanSlotIndex(dayIndex, timeIndex);
      const bg = scene.add.rectangle(x, rowY, slotWidth, slotHeight, 0x254a76, 1).setScrollFactor(0);
      bg.setStrokeStyle(2, 0x8ed2ff, 1);
      const badge = scene.add.rectangle(x - slotWidth / 2 + 42, rowY, 58, 30, 0x112942, 0.96).setScrollFactor(0);
      badge.setStrokeStyle(2, 0x8ed2ff, 1);
      const badgeText = scene.add.text(x - slotWidth / 2 + 42, rowY, timeLabel, {
        fontFamily: FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "bold",
        color: "#f4fbff",
        resolution: 2
      }).setOrigin(0.5).setScrollFactor(0);
      const infoText = scene.add.text(x - slotWidth / 2 + 82, rowY, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        fontStyle: "bold",
        color: "#f4fbff",
        resolution: 2,
        wordWrap: { width: slotInfoWidth }
      }).setOrigin(0, 0.5).setScrollFactor(0);
      infoText.setLineSpacing(2);
      const completionBadge = scene.add.circle(x + slotWidth / 2 - 24, rowY - slotHeight / 2 + 22, 14, 0xeaf6ff, 0.95).setScrollFactor(0);
      completionBadge.setStrokeStyle(2, 0x123150, 1);
      const completionText = scene.add.text(completionBadge.x, completionBadge.y - 1, "V", {
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        fontStyle: "bold",
        color: "#123150",
        resolution: 2
      }).setOrigin(0.5).setScrollFactor(0);
      refreshSlot(
        slotIndex,
        bg,
        badge,
        badgeText,
        infoText,
        completionBadge,
        completionText,
        draftPlan[slotIndex],
        fixedEventSlots?.get(slotIndex)
      );

      if (!fixedEventSlots?.has(slotIndex) && !completedSlotIndices?.has(slotIndex)) {
        bg.on("pointerdown", () => {
          const currentIndex = WEEKLY_PLAN_OPTIONS.findIndex((option) => option.id === draftPlan[slotIndex]);
          const nextIndex = (currentIndex + 1) % WEEKLY_PLAN_OPTIONS.length;
          draftPlan[slotIndex] = WEEKLY_PLAN_OPTIONS[nextIndex].id;
          refreshSlot(slotIndex, bg, badge, badgeText, infoText, completionBadge, completionText, draftPlan[slotIndex]);
        });
      }

      objects.push(bg, badge, badgeText, infoText, completionBadge, completionText);
    });
  });

  const legendOuter = scene.add
    .rectangle(legendPanelX, legendPanelY, legendPanelWidth + 6, legendPanelHeight + 6, 0x000000, 0)
    .setScrollFactor(0);
  legendOuter.setStrokeStyle(2, 0x3b6a92, 1);
  const legendBox = scene.add.rectangle(legendPanelX, legendPanelY, legendPanelWidth, legendPanelHeight, 0x112942, 0.94).setScrollFactor(0);
  legendBox.setStrokeStyle(2, 0x5aa8ee, 1);
  const legendLeftX = legendPanelX - legendPanelWidth / 2 + legendPaddingX;
  const legendTopY = legendPanelY - legendPanelHeight / 2 + legendPaddingTop;
  const legendSwatchOffsetX = 8;
  const legendTextOffsetX = 24;
  const legendTextWidth = legendPanelWidth - legendPaddingX * 2 - legendTextOffsetX;
  const legendTitle = scene.add.text(legendLeftX, legendTopY, "범례", {
    fontFamily: FONT_FAMILY,
    fontSize: "22px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0, 0).setScrollFactor(0);

  const legendEntries = [
    ...WEEKLY_PLAN_OPTIONS.map((option) => ({
      color: option.color,
      label: option.label,
      description: option.description
    })),
    {
      color: FIXED_EVENT_SLOT_COLOR,
      label: "이벤트",
      description: "고정 이벤트로 변경 불가"
    }
  ];

  objects.push(legendOuter, legendBox, legendTitle);
  legendEntries.forEach((entry, index) => {
    const rowTopY = legendTopY + legendTitle.height + legendTitleGap + index * legendRowHeight;
    const swatch = scene.add.rectangle(legendLeftX + legendSwatchOffsetX, rowTopY + 10, 18, 18, entry.color, 1).setScrollFactor(0);
    swatch.setStrokeStyle(2, 0x8ed2ff, 1);
    const label = scene.add.text(legendLeftX + legendTextOffsetX, rowTopY, entry.label, {
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2,
      wordWrap: { width: legendTextWidth }
    }).setOrigin(0, 0).setScrollFactor(0);
    label.setLineSpacing(4);
    const description = scene.add.text(legendLeftX + legendTextOffsetX, label.y + label.height + 6, entry.description, {
      fontFamily: FONT_FAMILY,
      fontSize: "12px",
      fontStyle: "bold",
      color: "#bddcff",
      resolution: 2,
      wordWrap: { width: legendTextWidth }
    }).setOrigin(0, 0).setScrollFactor(0);
    objects.push(swatch, label, description);
  });

  const actionButtonY = centerY + 286;
  const saveButton = createActionButton(scene, centerX - 126, actionButtonY, 220, 54, "계획 저장", () => {
    onConfirm([...draftPlan]);
  });
  const advanceButton = createActionButton(scene, centerX + 126, actionButtonY, 220, 54, "현재 시간 진행", () => {
    onAdvance([...draftPlan]);
  });

  objects.push(saveButton, advanceButton);
  root.add(objects);
  return root;
}

function createActionButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(0, 0, width, height, 0x29527d, 1).setScrollFactor(0);
  bg.setStrokeStyle(2, 0x8ed2ff, 1);
  const label = scene.add.text(0, -1, text, {
    fontFamily: FONT_FAMILY,
    fontSize: "20px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);
  const container = scene.add.container(x, y, [bg, label]).setScrollFactor(0);
  bg.setInteractive({ useHandCursor: true });
  bg.on("pointerdown", onClick);
  bg.on("pointerover", () => bg.setFillStyle(0x34679d, 1));
  bg.on("pointerout", () => bg.setFillStyle(0x29527d, 1));
  return container;
}
