// 게임에서 사용하는 지역 식별자와 월드 장소 식별자 정의
export const AREA_IDS = {
  world: "world",
  downtown: "downtown",
  campus: "campus"
} as const;

export type AreaId = (typeof AREA_IDS)[keyof typeof AREA_IDS];

export const PLACE_IDS = {
  home: "home",
  downtown: "downtown",
  campus: "campus",
  cafe: "cafe",
  store: "store"
} as const;

export type PlaceId = (typeof PLACE_IDS)[keyof typeof PLACE_IDS];
