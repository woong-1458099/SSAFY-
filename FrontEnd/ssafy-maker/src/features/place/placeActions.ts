import type { PlaceId } from "../../common/enums/area";
import {
  getPlaceActionDefinition,
  type PlaceActionPlaceId
} from "../../game/definitions/places/placeActionDefinitions";
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
  if (placeId === "campus" || placeId === "downtown" || placeId === "home") {
    return null;
  }

  const definition = getPlaceActionDefinition(placeId as PlaceActionPlaceId);
  return {
    title: definition.title,
    description: definition.description,
    actionText: definition.actionText
  };
}

export function resolvePlaceEffect(placeId: Exclude<PlaceId, "campus" | "downtown" | "home">): PlaceEffectResolution {
  const definition = getPlaceActionDefinition(placeId as PlaceActionPlaceId);
  return {
    cost: definition.cost,
    hpDelta: definition.hpDelta,
    hpMaxDelta: definition.hpMaxDelta,
    stressDelta: definition.stressDelta,
    moneyDelta: definition.moneyDelta,
    statDelta: definition.statDelta,
    minigameSceneKey: definition.minigameSceneKey,
    toastMessage: definition.toastMessage
  };
}
