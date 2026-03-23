export const FIXED_EVENT_CONDITION_GENDER_VALUES = ["MALE", "FEMALE"] as const;

export const FIXED_EVENT_STAT_CHANGE_KEYS = [
  "social",
  "code",
  "nunchi",
  "gold",
  "money",
  "hp",
  "stress",
  "luck",
  "favor_minsu",
  "favor_hyo",
  "favor_hyoryeon",
  "favor_pro",
  "favor_sunmi",
  "madness",
  "fe",
  "be",
  "teamwork"
] as const;

export type FixedEventConditionGenderValue = (typeof FIXED_EVENT_CONDITION_GENDER_VALUES)[number];
export type FixedEventStatChangeKey = (typeof FIXED_EVENT_STAT_CHANGE_KEYS)[number];
