import {
  getHomeActionDefinition,
  HOME_ACTION_DEFINITIONS,
  type HomeActionId
} from "../../game/definitions/places/placeActionDefinitions";
import type { PlayerStatKey } from "../../game/state/gameState";

export type HomeActionResolution = {
  hpDelta: number;
  stressDelta: number;
  statDelta: Partial<Record<PlayerStatKey, number>>;
  toastMessage: string;
};

export type { HomeActionId };

export const HOME_ACTION_LABELS: Record<HomeActionId, string> = Object.fromEntries(
  Object.entries(HOME_ACTION_DEFINITIONS).map(([actionId, definition]) => [actionId, definition.label])
) as Record<HomeActionId, string>;

export function resolveHomeAction(action: HomeActionId): HomeActionResolution {
  const definition = getHomeActionDefinition(action);
  return {
    hpDelta: definition.hpDelta,
    stressDelta: definition.stressDelta,
    statDelta: definition.statDelta,
    toastMessage: definition.toastMessage
  };
}
