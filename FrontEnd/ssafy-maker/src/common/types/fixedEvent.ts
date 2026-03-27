export const FIXED_EVENT_CONDITION_GENDER_VALUES = ["MALE", "FEMALE"] as const;

export const FIXED_EVENT_STAT_CHANGE_KEYS = [
  "social",
  "code",
  "nunchi",
  "money",
  "hp",
  "stress",
  "luck",
  "favor_minsu",
  "favor_hyoryeon",
  "fe",
  "be",
  "teamwork"
] as const;

export type FixedEventConditionGenderValue = (typeof FIXED_EVENT_CONDITION_GENDER_VALUES)[number];
export type FixedEventStatChangeKey = (typeof FIXED_EVENT_STAT_CHANGE_KEYS)[number];
