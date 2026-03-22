import type { PlaceId } from "../../common/enums/area";
import type { PlayerStatKey } from "../../game/state/gameState";
import type { LegacyMinigameSceneKey } from "../minigame/minigameSceneKeys";

export type PlacePopupContent = {
  title: string;
  description: string;
  actionText: string;
};

export type PlaceEffectResolution = {
  cost: number;
  hpDelta?: number;
  hpMaxDelta?: number;
  stressDelta?: number;
  moneyDelta?: number;
  statDelta?: Partial<Record<PlayerStatKey, number>>;
  minigameSceneKey?: LegacyMinigameSceneKey;
  toastMessage: string;
};

export function getPlacePopupContent(placeId: PlaceId): PlacePopupContent | null {
  switch (placeId) {
    case "cafe":
      return {
        title: "카페",
        description: "커피 한 잔 10,000G\n체력 회복 / 스트레스 감소",
        actionText: "커피 마시기"
      };
    case "store":
      return {
        title: "편의점",
        description: "소모품과 장비를 구매할 수 있습니다.",
        actionText: "상점 열기"
      };
    case "gym":
      return {
        title: "헬스장",
        description: "이용 비용 8,000G\n체력 한계 상승 / 스트레스 감소",
        actionText: "운동하기"
      };
    case "ramen":
      return {
        title: "라멘띵스",
        description: "이용 비용 12,000G\n체력 회복 / 스트레스 감소",
        actionText: "라멘 먹기"
      };
    case "lotto":
      return {
        title: "복권 판매점",
        description: "이용 비용 8,000G\n당첨 시 큰 돈을 얻을 수 있습니다.",
        actionText: "복권 구매"
      };
    case "karaoke":
      return {
        title: "노래방",
        description: "이용 비용 11,000G\n스트레스 대폭 감소 / 협업 증가",
        actionText: "노래 부르기"
      };
    case "beer":
      return {
        title: "역전할머니호프",
        description: "이용 비용 0G\n스트레스 감소 / 협업 증가 / 알바 수익",
        actionText: "맥주 마시기"
      };
    default:
      return null;
  }
}

export function resolvePlaceEffect(placeId: Exclude<PlaceId, "campus" | "downtown" | "home">): PlaceEffectResolution {
  switch (placeId) {
    case "cafe":
      return {
        cost: 10000,
        hpDelta: 8,
        stressDelta: -12,
        toastMessage: "카페에서 휴식했습니다"
      };
    case "store":
      return {
        cost: 0,
        toastMessage: "편의점을 이용합니다"
      };
    case "gym":
      return {
        cost: 8000,
        hpMaxDelta: 10,
        stressDelta: -6,
        statDelta: { teamwork: 1 },
        minigameSceneKey: "GymScene",
        toastMessage: "운동을 시작합니다"
      };
    case "ramen":
      return {
        cost: 12000,
        hpDelta: 14,
        stressDelta: -9,
        minigameSceneKey: "CookingScene",
        toastMessage: "라멘을 먹고 회복했습니다"
      };
    case "lotto":
      return {
        cost: 8000,
        minigameSceneKey: "LottoScene",
        toastMessage: "복권을 구매했습니다"
      };
    case "karaoke":
      return {
        cost: 11000,
        hpDelta: -2,
        stressDelta: -16,
        statDelta: { teamwork: 3 },
        minigameSceneKey: "RhythmScene",
        toastMessage: "노래방을 이용합니다"
      };
    case "beer":
      return {
        cost: 0,
        hpDelta: -8,
        stressDelta: -6,
        moneyDelta: 15000,
        statDelta: { teamwork: 2 },
        minigameSceneKey: "DrinkingScene",
        toastMessage: "호프를 이용합니다"
      };
  }
}
