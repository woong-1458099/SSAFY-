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

export function createWeeklyPlannerModal(scene: Phaser.Scene, options: {
  week: number;
  dayLabels: readonly string[];
  currentDayLabel: string;
  currentTimeLabel: string;
  actionPoint: number;
  maxActionPoint: number;
  initialPlan: WeeklyPlanOptionId[];
  onConfirm: (plan: WeeklyPlanOptionId[]) => void;
  onAdvance: (plan: WeeklyPlanOptionId[]) => void;
}): Phaser.GameObjects.Container {
  const { week, dayLabels, currentDayLabel, currentTimeLabel, actionPoint, maxActionPoint, initialPlan, onConfirm, onAdvance } =
    options;

  const centerX = Math.round(scene.scale.width / 2);
  const centerY = Math.round(scene.scale.height / 2);
  const panelWidth = 1080;
  const panelHeight = 640;
  const root = scene.add.container(0, 0).setDepth(2000).setScrollFactor(0);
  const overlay = scene.add.rectangle(centerX, centerY, scene.scale.width, scene.scale.height, 0x04101d, 0.62).setScrollFactor(0);
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
  const objects: Phaser.GameObjects.GameObject[] = [overlay, panel, title, subtitle];
  const left = centerX - 340;
  const top = centerY - 184;
  const cellWidth = 248;
  const cellHeight = 66;
  const gapX = 36;
  const gapY = 18;

  const refreshers: Array<() => void> = [];

  WEEKLY_PLAN_DAY_INDICES.forEach((dayIndex) => {
    const y = top + dayIndex * (cellHeight + gapY);
    const dayLabel = scene.add.text(left - 28, y + cellHeight / 2, dayLabels[dayIndex] ?? "", {
      fontFamily: FONT_FAMILY,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#eef7ff",
      resolution: 2
    }).setOrigin(1, 0.5).setScrollFactor(0);
    objects.push(dayLabel);

    WEEKLY_PLAN_TIME_LABELS.forEach((timeLabel, timeIndex) => {
      const x = left + timeIndex * (cellWidth + gapX);
      const slotIndex = getWeeklyPlanSlotIndex(dayIndex, timeIndex);
      const bg = scene.add.rectangle(x + cellWidth / 2, y + cellHeight / 2, cellWidth, cellHeight, 0x254a76, 1).setScrollFactor(0);
      bg.setStrokeStyle(2, 0x5aa8ee, 1);
      const badge = scene.add.rectangle(x + 40, y + cellHeight / 2, 62, 30, 0x112942, 0.96).setScrollFactor(0);
      badge.setStrokeStyle(2, 0x8ed2ff, 1);
      const badgeText = scene.add.text(x + 40, y + cellHeight / 2, timeLabel, {
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        fontStyle: "bold",
        color: "#f4fbff",
        resolution: 2
      }).setOrigin(0.5).setScrollFactor(0);
      const infoText = scene.add.text(x + 84, y + cellHeight / 2, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        fontStyle: "bold",
        color: "#f4fbff",
        resolution: 2,
        wordWrap: { width: cellWidth - 104 }
      }).setOrigin(0, 0.5).setScrollFactor(0);

      const refresh = () => {
        const option = getWeeklyPlanOption(draftPlan[slotIndex]);
        bg.setFillStyle(option.color, 0.96);
        infoText.setText(`${option.label}\n${option.description}`);
      };
      refresh();
      refreshers.push(refresh);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => {
        const currentIndex = WEEKLY_PLAN_OPTIONS.findIndex((option) => option.id === draftPlan[slotIndex]);
        const nextIndex = (currentIndex + 1) % WEEKLY_PLAN_OPTIONS.length;
        draftPlan[slotIndex] = WEEKLY_PLAN_OPTIONS[nextIndex].id;
        refresh();
      });

      objects.push(bg, badge, badgeText, infoText);
    });
  });

  const infoBox = scene.add.rectangle(centerX + 316, centerY - 36, 250, 330, 0x112942, 0.94).setScrollFactor(0);
  infoBox.setStrokeStyle(2, 0x5aa8ee, 1);
  const infoTitle = scene.add.text(centerX + 316, centerY - 176, "선택 규칙", {
    fontFamily: FONT_FAMILY,
    fontSize: "22px",
    fontStyle: "bold",
    color: "#eef7ff",
    resolution: 2
  }).setOrigin(0.5).setScrollFactor(0);
  const infoBody = scene.add.text(centerX + 206, centerY - 138, "칸을 클릭하면 일정이 순환됩니다.\n계획 저장 후 '현재 시간 진행'을 누르면 현재 슬롯의 보상이 적용되고 시간이 흐릅니다.\n주말/저녁/밤에는 계획 보상이 적용되지 않습니다.", {
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    color: "#b8d8f7",
    resolution: 2,
    wordWrap: { width: 220 },
    lineSpacing: 8
  }).setOrigin(0, 0).setScrollFactor(0);

  const saveButton = createActionButton(scene, centerX - 126, centerY + 274, 220, 54, "계획 저장", () => {
    onConfirm([...draftPlan]);
  });
  const advanceButton = createActionButton(scene, centerX + 126, centerY + 274, 220, 54, "현재 시간 진행", () => {
    onAdvance([...draftPlan]);
  });

  objects.push(infoBox, infoTitle, infoBody, saveButton, advanceButton);
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
