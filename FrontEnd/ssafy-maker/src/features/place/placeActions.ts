import { PLACE_BACKGROUND_KEYS } from "@shared/constants/placeBackgroundKeys";

export type PlaceId = "home" | "downtown" | "campus" | "cafe" | "store";
export type DowntownBuildingId = "ramenthings" | "gym" | "karaoke" | "hof" | "lottery";
export type PlaceStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";

export type PlacePopupContent = {
  title: string;
  description: string;
  actionText: string;
};

export type PlaceActionResolution =
  | {
      kind: "cafe";
      cost: number;
      hpDelta: number;
      stressDelta: number;
      moneyDelta: number;
      toastMessage: string;
    }
  | {
      kind: "store";
      toastMessage: string;
    };

export type DowntownBuildingResolution = {
  cost: number;
  hpDelta?: number;
  hpMaxDelta?: number;
  stressDelta?: number;
  moneyDelta?: number;
  statDelta?: Partial<Record<PlaceStatKey, number>>;
  toastMessage: string;
};

export function getPlaceBackgroundTextureKey(placeId: PlaceId): string | null {
  if (placeId === "home") return PLACE_BACKGROUND_KEYS.home;
  if (placeId === "cafe") return PLACE_BACKGROUND_KEYS.cafe;
  if (placeId === "store") return PLACE_BACKGROUND_KEYS.store;
  return null;
}

export function getDowntownBuildingBackgroundTextureKey(buildingId: DowntownBuildingId): string | null {
  if (buildingId === "gym") return PLACE_BACKGROUND_KEYS.gym;
  if (buildingId === "ramenthings") return PLACE_BACKGROUND_KEYS.ramenthings;
  if (buildingId === "karaoke") return PLACE_BACKGROUND_KEYS.karaoke;
  if (buildingId === "hof") return PLACE_BACKGROUND_KEYS.hof;
  if (buildingId === "lottery") return PLACE_BACKGROUND_KEYS.lottery;
  return null;
}

export function getPlacePopupContent(placeId: Extract<PlaceId, "cafe" | "store">): PlacePopupContent {
  if (placeId === "cafe") {
    return {
      title: "카페",
      description: "커피 한 잔 1,200G\n스트레스 감소 / 체력 소폭 회복",
      actionText: "커피 마시기",
    };
  }

  return {
    title: "편의점",
    description: "필요한 물품을 구매할 수 있습니다.",
    actionText: "상점 열기",
  };
}

export function resolvePlaceAction(placeId: Extract<PlaceId, "cafe" | "store">): PlaceActionResolution {
  if (placeId === "cafe") {
    return {
      kind: "cafe",
      cost: 10000,
      hpDelta: 8,
      stressDelta: -12,
      moneyDelta: -10000,
      toastMessage: "카페에서 휴식했습니다",
    };
  }

  return {
    kind: "store",
    toastMessage: "편의점 상점 열기",
  };
}

export function getDowntownBuildingConfig(
  buildingId: DowntownBuildingId
): { title: string; description: string; actionText?: string } {
  if (buildingId === "ramenthings") {
    return {
      title: "라멘띵스",
      description: "이용 비용: 12,000G\n특제 라멘 한 그릇\n체력 회복 / 스트레스 감소",
    };
  }
  if (buildingId === "gym") {
    return {
      title: "헬스장",
      description: "이용 비용: 8,000G\n간단 운동 프로그램 (미니게임)\n최대 체력 증가 / 스트레스 감소 / 협업 소폭 증가",
      actionText: "운동하기",
    };
  }
  if (buildingId === "karaoke") {
    return {
      title: "노래방",
      description: "이용 비용: 11,000G\n마음껏 노래하기\n스트레스 대폭 감소 / 협업 증가",
    };
  }
  if (buildingId === "hof") {
    return {
      title: "전통할머니호프",
      description: "이용 비용: 0G\n맥주 한 잔과 사람들과의 대화\n스트레스 감소 / 협업 증가 / 완료 시 +15,000G",
      actionText: "맥주 마시기",
    };
  }
  return {
    title: "복권판매점",
    description: "이용 비용: 8,000G\n5등 25,000G / 4등 170,000G / 3등 850,000G\n2등 8,500,000G / 1등 로또 엔딩",
    actionText: "복권 구매",
  };
}

export function resolveDowntownBuildingAction(
  buildingId: DowntownBuildingId
): DowntownBuildingResolution {
  if (buildingId === "ramenthings") {
    return {
      cost: 12000,
      hpDelta: 14,
      stressDelta: -9,
      toastMessage: "라멘을 먹고 회복했습니다",
    };
  }
  if (buildingId === "gym") {
    return {
      cost: 8000,
      hpMaxDelta: 10,
      stressDelta: -6,
      statDelta: { teamwork: 1 },
      toastMessage: "운동 완료 (최대 체력 +10)",
    };
  }
  if (buildingId === "karaoke") {
    return {
      cost: 11000,
      hpDelta: -2,
      stressDelta: -16,
      statDelta: { teamwork: 3 },
      toastMessage: "노래방 이용 완료",
    };
  }
  if (buildingId === "hof") {
    return {
      cost: 0,
      hpDelta: -8,
      stressDelta: -6,
      moneyDelta: 15000,
      statDelta: { teamwork: 2 },
      toastMessage: "호프 알바 완료 +15000G",
    };
  }
  return {
    cost: 8000,
    toastMessage: "복권을 구매했습니다",
  };
}
