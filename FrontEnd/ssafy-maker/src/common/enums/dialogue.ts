// 대화 스크립트 id를 공통으로 관리하는 열거형 정의
export const DIALOGUE_IDS = {
  minsuIntro: "minsu_intro",
  npcHyewon: "npc_hyewon",
  homeLocked: "home_locked",
  storeNotice: "store_notice",
  cafeNotice: "cafe_notice",
  gymNotice: "gym_notice",
  ramenNotice: "ramen_notice",
  lottoNotice: "lotto_notice",
  karaokeNotice: "karaoke_notice",
  beerNotice: "beer_notice",
  npcMinigameNpc: "npc_minigame_npc"
} as const;

export type DialogueId = (typeof DIALOGUE_IDS)[keyof typeof DIALOGUE_IDS];
