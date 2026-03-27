export type WeeklyPlanStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";
export type WeeklyPlanOptionId = "ui_practice" | "rest_api_db" | "team_project";

export type WeeklyPlanOption = {
  id: WeeklyPlanOptionId;
  label: string;
  description: string;
  statDelta: Partial<Record<WeeklyPlanStatKey, number>>;
  hpDelta: number;
  color: number;
};

export const WEEKLY_PLAN_TIME_LABELS = ["오전", "오후"] as const;
export const WEEKLY_PLAN_DAY_INDICES = [0, 1, 2, 3, 4] as const;

export const WEEKLY_PLAN_OPTIONS: WeeklyPlanOption[] = [
  {
    id: "ui_practice",
    label: "UI 구현 연습",
    description: "FE +4 / HP -20 / 스트레스 +2",
    statDelta: { fe: 4, stress: 2 },
    hpDelta: -20,
    color: 0x4c8ed9
  },
  {
    id: "rest_api_db",
    label: "REST API와 DB 설계",
    description: "BE +4 / HP -20 / 스트레스 +2",
    statDelta: { be: 4, stress: 2 },
    hpDelta: -20,
    color: 0x3d9d7a
  },
  {
    id: "team_project",
    label: "팀 프로젝트",
    description: "협업 +4 / HP -20 / 스트레스 +2",
    statDelta: { teamwork: 4, stress: 2 },
    hpDelta: -20,
    color: 0xb68543
  }
];

export function createDefaultWeeklyPlan(): WeeklyPlanOptionId[] {
  return Array.from(
    { length: WEEKLY_PLAN_DAY_INDICES.length * WEEKLY_PLAN_TIME_LABELS.length },
    () => WEEKLY_PLAN_OPTIONS[0].id
  );
}

export function getWeeklyPlanSlotIndex(dayIndex: number, timeIndex: number): number {
  return dayIndex * WEEKLY_PLAN_TIME_LABELS.length + timeIndex;
}

export function getWeeklyPlanOption(optionId: WeeklyPlanOptionId): WeeklyPlanOption {
  return WEEKLY_PLAN_OPTIONS.find((option) => option.id === optionId) ?? WEEKLY_PLAN_OPTIONS[0];
}

export function parseWeeklyPlanOptionId(value: unknown): WeeklyPlanOptionId | null {
  if (value === "ui_practice" || value === "rest_api_db" || value === "team_project") {
    return value;
  }
  return null;
}
