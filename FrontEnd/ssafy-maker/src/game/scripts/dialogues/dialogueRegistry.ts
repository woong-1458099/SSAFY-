// 대화 스크립트를 id 기준으로 모아두는 중앙 레지스트리
import type { DialogueScript } from "../../../common/types/dialogue";
import { MINSU_INTRO_DIALOGUE } from "./minsuIntroDialogue";
import { HYEWON_GREETING_DIALOGUE } from "./hyewonGreetingDialogue";

export const DIALOGUE_REGISTRY: Record<string, DialogueScript> = {
  [MINSU_INTRO_DIALOGUE.id]: MINSU_INTRO_DIALOGUE,
  [HYEWON_GREETING_DIALOGUE.id]: HYEWON_GREETING_DIALOGUE
};
