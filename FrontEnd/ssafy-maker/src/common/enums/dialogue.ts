// 대화 스크립트 id를 공통으로 관리하는 열거형 정의
export const DIALOGUE_IDS = {
  minsuIntro: "minsu_intro",
  yunaGreeting: "yuna_greeting"
} as const;

export type DialogueId = (typeof DIALOGUE_IDS)[keyof typeof DIALOGUE_IDS];
