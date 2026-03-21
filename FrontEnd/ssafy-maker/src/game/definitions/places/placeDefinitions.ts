import type { AreaId, PlaceId } from "../../../common/enums/area";
import type { DialogueId } from "../../../common/enums/dialogue";
import type { Rect } from "../../../common/types/geometry";

export type PlaceDefinition = {
  id: PlaceId;
  label: string;
  zone: Rect;
  movable: boolean;
  destinationArea?: AreaId;
  dialogueId?: DialogueId;
};

export const PLACE_DEFINITIONS: Record<PlaceId, PlaceDefinition> = {
  campus: {
    id: "campus",
    label: "캠퍼스",
    zone: { x: 190, y: 180, width: 190, height: 150 },
    movable: true,
    destinationArea: "campus"
  },
  home: {
    id: "home",
    label: "집",
    zone: { x: 500, y: 210, width: 180, height: 150 },
    movable: false,
    dialogueId: "home_locked"
  },
  store: {
    id: "store",
    label: "편의점",
    zone: { x: 830, y: 250, width: 150, height: 120 },
    movable: false,
    dialogueId: "store_notice"
  },
  cafe: {
    id: "cafe",
    label: "카페",
    zone: { x: 420, y: 520, width: 150, height: 120 },
    movable: false,
    dialogueId: "cafe_notice"
  },
  downtown: {
    id: "downtown",
    label: "번화가",
    zone: { x: 730, y: 180, width: 170, height: 140 },
    movable: true,
    destinationArea: "downtown"
  }
};

export function getPlaceDefinition(placeId: PlaceId) {
  return PLACE_DEFINITIONS[placeId];
}

export function getMovablePlaceDefinitions() {
  return Object.values(PLACE_DEFINITIONS).filter((place) => place.movable && place.destinationArea);
}

export function getStaticPlaceDefinitions() {
  return Object.values(PLACE_DEFINITIONS).filter((place) => !place.movable && place.dialogueId);
}
