import type { PlaceId } from "../../../common/enums/area";
import type { LegacyMinigameSceneKey } from "../../../features/minigame/minigameSceneKeys";
import type { PlayerStatKey } from "../../state/gameState";

export type HomeActionId = "sleep" | "frontendStudy" | "backendStudy" | "game";
export type ActionEffectStatDelta = Partial<Record<PlayerStatKey, number>>;

export type HomeActionDefinition = {
  label: string;
  hpDelta: number;
  stressDelta: number;
  statDelta: ActionEffectStatDelta;
  toastMessage: string;
};

export type PlaceActionPlaceId = Exclude<PlaceId, "campus" | "downtown" | "home">;

export type PlaceActionDefinition = {
  title: string;
  description: string;
  actionText: string;
  cost: number;
  hpDelta?: number;
  hpMaxDelta?: number;
  stressDelta?: number;
  moneyDelta?: number;
  statDelta?: ActionEffectStatDelta;
  minigameSceneKey?: LegacyMinigameSceneKey;
  toastMessage: string;
};

export const HOME_ACTION_DEFINITIONS: Record<HomeActionId, HomeActionDefinition> = {
  sleep: {
    label: "잠자기 - 체력 회복 / 스트레스 감소",
    hpDelta: 20,
    stressDelta: -6,
    statDelta: {},
    toastMessage: "잠자기를 마쳤습니다"
  },
  frontendStudy: {
    label: "프론트 공부 - FE 상승 / 체력 감소",
    hpDelta: -12,
    stressDelta: 14,
    statDelta: { fe: 1 },
    toastMessage: "프론트 공부를 마쳤습니다"
  },
  backendStudy: {
    label: "백엔드 공부 - BE 상승 / 체력 감소",
    hpDelta: -12,
    stressDelta: 14,
    statDelta: { be: 1 },
    toastMessage: "백엔드 공부를 마쳤습니다"
  },
  game: {
    label: "게임하기 - 스트레스 감소 / 운 상승",
    hpDelta: -2,
    stressDelta: -8,
    statDelta: { luck: 1 },
    toastMessage: "게임을 마쳤습니다"
  }
};

export const PLACE_ACTION_DEFINITIONS: Record<PlaceActionPlaceId, PlaceActionDefinition> = {
  cafe: {
    title: "카페",
    description: "커피 비용 7,000G\n체력 회복 / 스트레스 감소 / FE 상승",
    actionText: "커피 마시기",
    cost: 7000,
    hpDelta: 8,
    stressDelta: -10,
    statDelta: { fe: 1 },
    toastMessage: "카페에서 휴식했습니다"
  },
  store: {
    title: "편의점",
    description: "소모품과 장비를 구매할 수 있습니다.",
    actionText: "상점 열기",
    cost: 0,
    toastMessage: "편의점을 이용합니다"
  },
  gym: {
    title: "헬스장",
    description: "이용 비용 15,000G\n최대 체력 상승 / 스트레스 감소 / 협업 상승",
    actionText: "운동하기",
    cost: 15000,
    hpDelta: -4,
    hpMaxDelta: 2,
    stressDelta: -8,
    statDelta: { teamwork: 1 },
    minigameSceneKey: "GymScene",
    toastMessage: "운동을 시작합니다"
  },
  ramen: {
    title: "라멘집",
    description: "이용 비용 9,000G\n체력 회복 / 스트레스 감소",
    actionText: "라멘 먹기",
    cost: 9000,
    hpDelta: 20,
    stressDelta: -8,
    minigameSceneKey: "CookingScene",
    toastMessage: "라멘을 먹고 회복했습니다"
  },
  lotto: {
    title: "복권 판매점",
    description: "이용 비용 8,000G\n복권으로 대박을 노릴 수 있습니다.",
    actionText: "복권 구매",
    cost: 8000,
    minigameSceneKey: "LottoScene",
    toastMessage: "복권을 구매했습니다"
  },
  karaoke: {
    title: "노래방",
    description: "이용 비용 16,000G\n스트레스 감소 / 협업 상승",
    actionText: "노래 부르기",
    cost: 16000,
    hpDelta: -4,
    stressDelta: -14,
    statDelta: { teamwork: 2 },
    minigameSceneKey: "RhythmScene",
    toastMessage: "노래방을 이용합니다"
  },
  beer: {
    title: "호프집",
    description: "이용 비용 12,000G\n스트레스 감소 / 협업 상승 / 운 상승",
    actionText: "맥주 마시기",
    cost: 12000,
    hpDelta: -9,
    stressDelta: -10,
    statDelta: { teamwork: 2, luck: 1 },
    minigameSceneKey: "DrinkingScene",
    toastMessage: "호프집을 이용합니다"
  }
};

export function getHomeActionDefinition(actionId: HomeActionId): HomeActionDefinition {
  return HOME_ACTION_DEFINITIONS[actionId];
}

export function getPlaceActionDefinition(placeId: PlaceActionPlaceId): PlaceActionDefinition {
  return PLACE_ACTION_DEFINITIONS[placeId];
}
