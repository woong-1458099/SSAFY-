import Phaser from "phaser";
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

export function createWeeklyPlannerModal(scene: Phaser.Scene, options: {
  week: number;
  dayLabels: readonly string[];
  currentDayLabel: string;
  currentTimeLabel: string;
  actionPoint: number;
  maxActionPoint: number;
  fixedEventSlots?: ReadonlyMap<number, string>;
  initialPlan: WeeklyPlanOptionId[];
  onConfirm: (plan: WeeklyPlanOptionId[]) => void;
  onAdvance: (plan: WeeklyPlanOptionId[]) => void;
}): Phaser.GameObjects.Container {
  const { week, dayLabels, currentDayLabel, currentTimeLabel, actionPoint, maxActionPoint, fixedEventSlots, initialPlan, onConfirm, onAdvance } =
    options;

  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const panelWidth = 1100;
  const panelHeight = 640;
  const root = scene.add.container(0, 0).setDepth(9700).setScrollFactor(0);
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
  const gridCenterX = centerX - 124;
  const amX = gridCenterX - 145;
  const pmX = gridCenterX + 145;
  const headerY = centerY - 180;
  const rowStartY = centerY - 126;
  const rowGap = 84;
  const slotWidth = 268;
  const slotHeight = 70;
  const slotInfoWidth = slotWidth - 112;
  const dayLabelRightX = amX - slotWidth / 2 - 28;
  const legendPanelWidth = 270;
  const legendPanelHeight = 346;
  const legendPanelX = centerX + 320;
  const legendPanelY = centerY - 26;

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

  const refreshSlot = (
    bg: Phaser.GameObjects.Rectangle,
    badgeBg: Phaser.GameObjects.Rectangle,
    badgeText: Phaser.GameObjects.Text,
    infoText: Phaser.GameObjects.Text,
    optionId: WeeklyPlanOptionId,
    fixedEventName?: string
  ): void => {
    const option = getWeeklyPlanOption(optionId);
    const isFixedEvent = typeof fixedEventName === "string" && fixedEventName.trim().length > 0;
    if (isFixedEvent) {
      bg.setFillStyle(FIXED_EVENT_SLOT_COLOR, 0.96);
      bg.setStrokeStyle(2, 0xffaacb, 1);
      badgeBg.setFillStyle(0x321631, 0.98);
      badgeText.setText(`${badgeText.text.replace(" 이벤트", "")} 이벤트`);
      infoText.setText(`${fixedEventName}\n고정 이벤트`);
      bg.disableInteractive();
      return;
    }

    bg.setFillStyle(option.color, 0.95);
    bg.setStrokeStyle(2, 0x8ed2ff, 1);
    badgeBg.setFillStyle(0x133150, 0.96);
    badgeText.setText(badgeText.text.replace(" 이벤트", ""));
    infoText.setText(`${option.label}\n${option.description}`);
    bg.disableInteractive();
    bg.setInteractive({ useHandCursor: true });
  };

  WEEKLY_PLAN_DAY_INDICES.forEach((dayIndex) => {
    const rowY = rowStartY + dayIndex * rowGap;
    const dayLabel = scene.add.text(dayLabelRightX, rowY, dayLabels[dayIndex] ?? "", {
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
      refreshSlot(bg, badge, badgeText, infoText, draftPlan[slotIndex], fixedEventSlots?.get(slotIndex));

      if (!fixedEventSlots?.has(slotIndex)) {
        bg.on("pointerdown", () => {
          const currentIndex = WEEKLY_PLAN_OPTIONS.findIndex((option) => option.id === draftPlan[slotIndex]);
          const nextIndex = (currentIndex + 1) % WEEKLY_PLAN_OPTIONS.length;
          draftPlan[slotIndex] = WEEKLY_PLAN_OPTIONS[nextIndex].id;
          refreshSlot(bg, badge, badgeText, infoText, draftPlan[slotIndex]);
        });
      }

      objects.push(bg, badge, badgeText, infoText);
    });
  });

  const legendOuter = scene.add
    .rectangle(legendPanelX, legendPanelY, legendPanelWidth + 6, legendPanelHeight + 6, 0x000000, 0)
    .setScrollFactor(0);
  legendOuter.setStrokeStyle(2, 0x3b6a92, 1);
  const legendBox = scene.add.rectangle(legendPanelX, legendPanelY, legendPanelWidth, legendPanelHeight, 0x112942, 0.94).setScrollFactor(0);
  legendBox.setStrokeStyle(2, 0x5aa8ee, 1);
  const legendTitle = scene.add.text(legendPanelX, legendPanelY - 136, "범례", {
    fontFamily: FONT_FAMILY,
    fontSize: "22px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);

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
    const legendY = legendPanelY - legendPanelHeight / 2 + 78 + index * 74;
    const swatch = scene.add.rectangle(legendPanelX - 102, legendY - 8, 18, 18, entry.color, 1).setScrollFactor(0);
    swatch.setStrokeStyle(2, 0x8ed2ff, 1);
    const label = scene.add.text(legendPanelX - 82, legendY - 16, entry.label, {
      fontFamily: FONT_FAMILY,
      fontSize: "15px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2,
      wordWrap: { width: 164 }
    }).setOrigin(0, 0).setScrollFactor(0);
    label.setLineSpacing(4);
    const description = scene.add.text(legendPanelX - 82, label.y + label.height + 8, entry.description, {
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      fontStyle: "bold",
      color: "#bddcff",
      resolution: 2,
      wordWrap: { width: 164 }
    }).setOrigin(0, 0).setScrollFactor(0);
    objects.push(swatch, label, description);
  });

  const saveButton = createActionButton(scene, centerX - 126, centerY + 274, 220, 54, "계획 저장", () => {
    onConfirm([...draftPlan]);
  });
  const advanceButton = createActionButton(scene, centerX + 126, centerY + 274, 220, 54, "현재 시간 진행", () => {
    onAdvance([...draftPlan]);
  });

  objects.push(legendBox, legendTitle, saveButton, advanceButton);
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
