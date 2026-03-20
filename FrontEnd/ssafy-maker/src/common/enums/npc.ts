export const NPC_IDS = {
  minsu: "minsu",
  hyewon: "hyewon",
  hyunseok: "hyunseok"
} as const;

export type NpcId = (typeof NPC_IDS)[keyof typeof NPC_IDS];
