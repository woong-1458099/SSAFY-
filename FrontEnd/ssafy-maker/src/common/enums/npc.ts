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
