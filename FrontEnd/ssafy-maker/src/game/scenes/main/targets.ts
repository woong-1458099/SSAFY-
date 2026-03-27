import Phaser from "phaser";
import type { AreaId } from "../../../common/enums/area";
import { getStaticPlaceDefinitions } from "../../definitions/places/placeDefinitions";
import { getAreaTransitionDefinitions } from "../../definitions/places/areaTransitionDefinitions";
import type { WorldRenderBounds } from "../../managers/WorldManager";
import type { RuntimeStaticPlaceTarget } from "../../managers/InteractionManager";
import type { ParsedTmxMap, TmxRuntimeGrids } from "../../systems/tmxNavigation";
import { buildAdjacentWalkableTiles, extractConnectedRegionsFromGrid } from "../../systems/tmxNavigation";
import type { RuntimeAreaTransitionTarget } from "../../view/AreaTransitionOverlay";

type ResolveAreaTransitionTargetsArgs = {
  areaId: AreaId;
  renderBounds?: WorldRenderBounds;
  hasRomanceEventForArea?: (areaId: AreaId) => boolean;
};

type ResolveStaticPlaceTargetsArgs = {
  areaId: AreaId;
  renderBounds?: WorldRenderBounds;
  parsedMap?: ParsedTmxMap;
  runtimeGrids?: TmxRuntimeGrids;
};

export function resolveAreaTransitionTargets(args: ResolveAreaTransitionTargetsArgs): RuntimeAreaTransitionTarget[] {
  const { areaId, renderBounds, hasRomanceEventForArea } = args;
  if (!renderBounds) {
    return [];
  }

  return getAreaTransitionDefinitions(areaId).map((transition) => ({
    id: transition.id,
    label: transition.label,
    isRomance: hasRomanceEventForArea?.(transition.toArea) === true,
    centerX:
      renderBounds.offsetX +
      (transition.tileX + (transition.tileWidth ?? 1) / 2) *
        renderBounds.tileWidth *
        renderBounds.scale,
    centerY:
      renderBounds.offsetY +
      (transition.tileY + (transition.tileHeight ?? 1) / 2) *
        renderBounds.tileHeight *
        renderBounds.scale,
    zoneX:
      renderBounds.offsetX +
      transition.tileX * renderBounds.tileWidth * renderBounds.scale,
    zoneY:
      renderBounds.offsetY +
      transition.tileY * renderBounds.tileHeight * renderBounds.scale,
    zoneWidth:
      (transition.tileWidth ?? 1) * renderBounds.tileWidth * renderBounds.scale,
    zoneHeight:
      (transition.tileHeight ?? 1) * renderBounds.tileHeight * renderBounds.scale,
    tileX: transition.tileX,
    tileY: transition.tileY,
    tileWidth: transition.tileWidth ?? 1,
    tileHeight: transition.tileHeight ?? 1,
    arrowDirection: transition.arrowDirection ?? "up",
    labelPlacement: transition.labelPlacement ?? "below"
  }));
}

export function resolveStaticPlaceTargets(args: ResolveStaticPlaceTargetsArgs): RuntimeStaticPlaceTarget[] {
  const { areaId, renderBounds, parsedMap, runtimeGrids } = args;
  if (!renderBounds) {
    return [];
  }

  const staticPlaces = getStaticPlaceDefinitions(areaId);
  const tmxDerivedTargets = resolveTmxStaticPlaceTargets({
    staticPlaces,
    renderBounds,
    parsedMap,
    runtimeGrids
  });

  return staticPlaces.map((place) => {
    const tmxTarget = tmxDerivedTargets.get(place.id);
    if (tmxTarget) {
      return tmxTarget;
    }

    const interactionZone = place.interactionZone ?? place.zone;

    return {
      id: place.id,
      label: place.label,
      dialogueId: place.dialogueId!,
      x: renderBounds.offsetX + (interactionZone.x + interactionZone.width / 2) * renderBounds.scale,
      y: renderBounds.offsetY + (interactionZone.y + interactionZone.height / 2) * renderBounds.scale,
      zoneX: renderBounds.offsetX + interactionZone.x * renderBounds.scale,
      zoneY: renderBounds.offsetY + interactionZone.y * renderBounds.scale,
      zoneWidth: interactionZone.width * renderBounds.scale,
      zoneHeight: interactionZone.height * renderBounds.scale
    };
  });
}

type ResolveTmxStaticPlaceTargetsArgs = {
  staticPlaces: ReturnType<typeof getStaticPlaceDefinitions>;
  renderBounds?: WorldRenderBounds;
  parsedMap?: ParsedTmxMap;
  runtimeGrids?: TmxRuntimeGrids;
};

function resolveTmxStaticPlaceTargets(args: ResolveTmxStaticPlaceTargetsArgs) {
  const { staticPlaces, renderBounds, parsedMap, runtimeGrids } = args;
  const targets = new Map<RuntimeStaticPlaceTarget["id"], RuntimeStaticPlaceTarget>();

  if (!renderBounds || !parsedMap || !runtimeGrids || staticPlaces.length === 0) {
    return targets;
  }

  const availableRegions = extractConnectedRegionsFromGrid(runtimeGrids.interactionGrid, 2);
  if (availableRegions.length === 0) {
    return targets;
  }

  staticPlaces.forEach((place) => {
    if (availableRegions.length === 0) {
      return;
    }

    const anchorTileX = Phaser.Math.Clamp(
      Math.floor((place.zone.x + place.zone.width / 2) / parsedMap.tileWidth),
      0,
      parsedMap.width - 1
    );
    const anchorTileY = Phaser.Math.Clamp(
      Math.floor((place.zone.y + place.zone.height / 2) / parsedMap.tileHeight),
      0,
      parsedMap.height - 1
    );

    let bestRegionIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    availableRegions.forEach((region, index) => {
      const dx = region.centerX - anchorTileX;
      const dy = region.centerY - anchorTileY;
      const distance = dx * dx + dy * dy;

      if (distance < bestDistance) {
        bestDistance = distance;
        bestRegionIndex = index;
      }
    });

    if (bestRegionIndex < 0) {
      return;
    }

    const [region] = availableRegions.splice(bestRegionIndex, 1);
    if (!region) {
      return;
    }

    const promptTiles = buildAdjacentWalkableTiles(region, runtimeGrids.blockedGrid).map((tile) => ({
      tileX: tile.x,
      tileY: tile.y
    }));

    if (promptTiles.length === 0) {
      return;
    }

    const minTileX = Math.min(...promptTiles.map((tile) => tile.tileX));
    const maxTileX = Math.max(...promptTiles.map((tile) => tile.tileX));
    const minTileY = Math.min(...promptTiles.map((tile) => tile.tileY));
    const maxTileY = Math.max(...promptTiles.map((tile) => tile.tileY));
    const scaledTileWidth = renderBounds.tileWidth * renderBounds.scale;
    const scaledTileHeight = renderBounds.tileHeight * renderBounds.scale;
    const zoneX = renderBounds.offsetX + minTileX * scaledTileWidth;
    const zoneY = renderBounds.offsetY + minTileY * scaledTileHeight;
    const zoneWidth = (maxTileX - minTileX + 1) * scaledTileWidth;
    const zoneHeight = (maxTileY - minTileY + 1) * scaledTileHeight;

    targets.set(place.id, {
      id: place.id,
      label: place.label,
      dialogueId: place.dialogueId!,
      x: zoneX + zoneWidth / 2,
      y: zoneY + zoneHeight / 2,
      zoneX,
      zoneY,
      zoneWidth,
      zoneHeight,
      promptTiles
    });
  });

  return targets;
}
