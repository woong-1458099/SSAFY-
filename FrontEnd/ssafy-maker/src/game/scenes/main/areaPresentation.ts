import type { AreaId } from "../../../common/enums/area";
import { findFirstWalkableTile, type ParsedTmxMap, type TmxRuntimeGrids } from "../../systems/tmxNavigation";

export function getAreaPresentationLabel(areaId: AreaId): string {
  switch (areaId) {
    case "campus":
      return "캠퍼스";
    case "classroom":
      return "교실";
    case "downtown":
      return "번화가";
    case "world":
    default:
      return "전체 지역";
  }
}

export function isWalkableRefreshTile(
  tileX: number,
  tileY: number,
  runtimeGrids: TmxRuntimeGrids,
  parsedMap: ParsedTmxMap
): boolean {
  if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
    return false;
  }

  return runtimeGrids.blockedGrid[tileY]?.[tileX] !== true;
}

export function findNearestWalkableRefreshTile(
  originTileX: number,
  originTileY: number,
  runtimeGrids: TmxRuntimeGrids,
  parsedMap: ParsedTmxMap
) {
  const maxRadius = Math.max(parsedMap.width, parsedMap.height);

  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) {
          continue;
        }

        const tileX = originTileX + dx;
        const tileY = originTileY + dy;
        if (isWalkableRefreshTile(tileX, tileY, runtimeGrids, parsedMap)) {
          return { tileX, tileY };
        }
      }
    }
  }

  return findFirstWalkableTile(runtimeGrids.blockedGrid);
}

export function resolveSafeRefreshTile(
  playerSnapshot: { tileX: number; tileY: number } | undefined,
  runtimeGrids?: TmxRuntimeGrids,
  parsedMap?: ParsedTmxMap
) {
  if (!playerSnapshot || !runtimeGrids || !parsedMap) {
    return undefined;
  }

  if (isWalkableRefreshTile(playerSnapshot.tileX, playerSnapshot.tileY, runtimeGrids, parsedMap)) {
    return {
      tileX: playerSnapshot.tileX,
      tileY: playerSnapshot.tileY
    };
  }

  return findNearestWalkableRefreshTile(playerSnapshot.tileX, playerSnapshot.tileY, runtimeGrids, parsedMap);
}
