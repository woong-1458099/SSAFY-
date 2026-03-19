export type WeeklyPlanStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";
export type WeeklyPlanOptionId = "ui_practice" | "rest_api_db" | "team_project";

export type WeeklyPlanOption = {
  id: WeeklyPlanOptionId;
  label: string;
  description: string;
  statDelta: Partial<Record<WeeklyPlanStatKey, number>>;
  color: number;
};

export const WEEKLY_PLAN_TIME_LABELS = ["\uC624\uC804", "\uC624\uD6C4"] as const;
export const WEEKLY_PLAN_DAY_INDICES = [0, 1, 2, 3, 4] as const;
export const WEEKLY_PLAN_ACTIVITY_TEXTURE_KEYS: Record<WeeklyPlanOptionId, string> = {
  ui_practice: "weekly-plan-ui-practice",
  rest_api_db: "weekly-plan-rest-api-db",
  team_project: "weekly-plan-team-project",
};

export const WEEKLY_PLAN_OPTIONS: WeeklyPlanOption[] = [
  {
    id: "ui_practice",
    label: "UI \uAD6C\uD604 \uC5F0\uC2B5",
    description: "FE \uB2A5\uB825\uCE58 \uD68D\uB4DD",
    statDelta: { fe: 4 },
    color: 0x4c8ed9,
  },
  {
    id: "rest_api_db",
    label: "REST API\uC640 \uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC124\uACC4",
    description: "BE \uB2A5\uB825\uCE58 \uD68D\uB4DD",
    statDelta: { be: 4 },
    color: 0x3d9d7a,
  },
  {
    id: "team_project",
    label: "\uD300 \uD504\uB85C\uC81D\uD2B8",
    description: "\uD611\uC5C5 \uB2A5\uB825\uCE58 \uD68D\uB4DD",
    statDelta: { teamwork: 4 },
    color: 0xb68543,
  },
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
  if (value === "ui_practice" || value === "rest_api_db" || value === "team_project") return value;
  return null;
}

export function getCurrentWeeklyPlanSlotKey(
  week: number,
  dayIndex: number,
  timeIndex: number
): string | null {
  if (dayIndex < 0 || dayIndex >= WEEKLY_PLAN_DAY_INDICES.length) return null;
  if (timeIndex < 0 || timeIndex >= WEEKLY_PLAN_TIME_LABELS.length) return null;
  return `${week}-${dayIndex}-${timeIndex}`;
}

export function parseWeeklyPlanSlotKey(
  value: string
): { week: number; dayIndex: number; timeIndex: number } | null {
  const [weekText, dayText, timeText] = value.split("-");
  const week = Number.parseInt(weekText ?? "", 10);
  const dayIndex = Number.parseInt(dayText ?? "", 10);
  const timeIndex = Number.parseInt(timeText ?? "", 10);
  if (!Number.isFinite(week) || !Number.isFinite(dayIndex) || !Number.isFinite(timeIndex)) {
    return null;
  }
  if (dayIndex < 0 || dayIndex >= WEEKLY_PLAN_DAY_INDICES.length) return null;
  if (timeIndex < 0 || timeIndex >= WEEKLY_PLAN_TIME_LABELS.length) return null;
  return { week, dayIndex, timeIndex };
}
