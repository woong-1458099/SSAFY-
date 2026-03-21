// 대화 스크립트를 id 기준으로 모아두는 중앙 레지스트리
import type { DialogueScript } from "../../../common/types/dialogue";
import { CAFE_NOTICE_DIALOGUE } from "./cafeNoticeDialogue";
import { HOME_LOCKED_DIALOGUE } from "./homeLockedDialogue";
import { MINSU_INTRO_DIALOGUE } from "./minsuIntroDialogue";
import { HYEWON_GREETING_DIALOGUE } from "./hyewonGreetingDialogue";
import { STORE_NOTICE_DIALOGUE } from "./storeNoticeDialogue";

export const DIALOGUE_REGISTRY: Record<string, DialogueScript> = {
  [HOME_LOCKED_DIALOGUE.id]: HOME_LOCKED_DIALOGUE,
  [STORE_NOTICE_DIALOGUE.id]: STORE_NOTICE_DIALOGUE,
  [CAFE_NOTICE_DIALOGUE.id]: CAFE_NOTICE_DIALOGUE,
  [MINSU_INTRO_DIALOGUE.id]: MINSU_INTRO_DIALOGUE,
  [HYEWON_GREETING_DIALOGUE.id]: HYEWON_GREETING_DIALOGUE
};
