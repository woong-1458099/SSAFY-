export const NPC_IDS = {
  minsu: "minsu",
  hyewon: "hyewon",
  hyunseok: "hyunseok",
  hyoryeon: "hyoryeon",
  jiwoo: "jiwoo",
  jongmin: "jongmin",
  myungjin: "myungjin",
  yeonwoong: "yeonwoong",
  doyeon: "doyeon",
  sunmi: "sunmi",
  minseok: "minseok"
} as const;

export type NpcId = (typeof NPC_IDS)[keyof typeof NPC_IDS];

const NPC_ID_SET = new Set<string>(Object.values(NPC_IDS));

export const AFFECTION_NPC_IDS = {
  minsu: NPC_IDS.minsu,
  hyoryeon: NPC_IDS.hyoryeon,
  sunmi: NPC_IDS.sunmi
} as const;

export type AffectionNpcId = (typeof AFFECTION_NPC_IDS)[keyof typeof AFFECTION_NPC_IDS];

const AFFECTION_NPC_ALIAS_MAP: Record<string, AffectionNpcId> = {
  minsu: AFFECTION_NPC_IDS.minsu,
  hyoryeon: AFFECTION_NPC_IDS.hyoryeon,
  hyo: AFFECTION_NPC_IDS.hyoryeon,
  sunmi: AFFECTION_NPC_IDS.sunmi,
  pro: AFFECTION_NPC_IDS.sunmi
};

function normalizeAffectionToken(value: string): string {
  const token = value.trim().toLowerCase();
  return token.startsWith("favor_") ? token.slice("favor_".length) : token;
}

export function isNpcId(value: string): value is NpcId {
  return NPC_ID_SET.has(value);
}

export function isAffectionNpcId(value: string): value is AffectionNpcId {
  return normalizeAffectionNpcId(value) !== null;
}

export function normalizeAffectionNpcId(value: string): AffectionNpcId | null {
  if (typeof value !== "string") {
    return null;
  }

  return AFFECTION_NPC_ALIAS_MAP[normalizeAffectionToken(value)] ?? null;
}
