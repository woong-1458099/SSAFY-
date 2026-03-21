import type { AreaId, PlaceId } from "../../../common/enums/area";
import type { DialogueId } from "../../../common/enums/dialogue";
import type { Rect } from "../../../common/types/geometry";

export type PlaceDefinition = {
  id: PlaceId;
  area: AreaId;
  label: string;
  zone: Rect;
  movable: boolean;
  destinationArea?: AreaId;
  dialogueId?: DialogueId;
};

export const PLACE_DEFINITIONS: Record<PlaceId, PlaceDefinition> = {
  campus: {
    id: "campus",
    area: "world",
    label: "캠퍼스",
    zone: { x: 160, y: 150, width: 210, height: 180 },
    movable: true,
    destinationArea: "campus"
  },
  downtown: {
    id: "downtown",
    area: "world",
    label: "번화가",
    zone: { x: 730, y: 180, width: 170, height: 140 },
    movable: true,
    destinationArea: "downtown"
  },
  home: {
    id: "home",
    area: "world",
    label: "집",
    zone: { x: 410, y: 365, width: 230, height: 180 },
    movable: false,
    dialogueId: "home_locked"
  },
  store: {
    id: "store",
    area: "world",
    label: "편의점",
    zone: { x: 820, y: 190, width: 180, height: 180 },
    movable: false,
    dialogueId: "store_notice"
  },
  cafe: {
    id: "cafe",
    area: "world",
    label: "카페",
    zone: { x: 810, y: 420, width: 200, height: 150 },
    movable: false,
    dialogueId: "cafe_notice"
  },
  gym: {
    id: "gym",
    area: "downtown",
    label: "헬스장",
    zone: { x: 110, y: 90, width: 190, height: 170 },
    movable: false,
    dialogueId: "gym_notice"
  },
  ramen: {
    id: "ramen",
    area: "downtown",
    label: "라멘띵스",
    zone: { x: 390, y: 70, width: 180, height: 200 },
    movable: false,
    dialogueId: "ramen_notice"
  },
  lotto: {
    id: "lotto",
    area: "downtown",
    label: "복권 판매점",
    zone: { x: 650, y: 80, width: 190, height: 180 },
    movable: false,
    dialogueId: "lotto_notice"
  },
  karaoke: {
    id: "karaoke",
    area: "downtown",
    label: "노래방",
    zone: { x: 390, y: 370, width: 210, height: 170 },
    movable: false,
    dialogueId: "karaoke_notice"
  },
  beer: {
    id: "beer",
    area: "downtown",
    label: "역전할머니호프",
    zone: { x: 610, y: 365, width: 220, height: 180 },
    movable: false,
    dialogueId: "beer_notice"
  }
};

export function getPlaceDefinition(placeId: PlaceId) {
  return PLACE_DEFINITIONS[placeId];
}

export function getMovablePlaceDefinitions(areaId?: AreaId) {
  return Object.values(PLACE_DEFINITIONS).filter(
    (place) => (!areaId || place.area === areaId) && place.movable && place.destinationArea
  );
}

export function getStaticPlaceDefinitions(areaId?: AreaId) {
  return Object.values(PLACE_DEFINITIONS).filter(
    (place) => (!areaId || place.area === areaId) && !place.movable && place.dialogueId
  );
}
