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
  sunmi: "sunmi"
} as const;

export type NpcId = (typeof NPC_IDS)[keyof typeof NPC_IDS];

const NPC_ID_SET = new Set<string>(Object.values(NPC_IDS));

export function isNpcId(value: string): value is NpcId {
  return NPC_ID_SET.has(value);
}
