import type { AreaId } from "../../../common/enums/area";
import { findFirstWalkableTile, type ParsedTmxMap, type TmxRuntimeGrids } from "../../systems/tmxNavigation";

const MAX_REFRESH_SEARCH_RADIUS = 16;

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
  if (isWalkableRefreshTile(originTileX, originTileY, runtimeGrids, parsedMap)) {
    return { tileX: originTileX, tileY: originTileY };
  }

  const maxRadius = Math.min(Math.max(parsedMap.width, parsedMap.height), MAX_REFRESH_SEARCH_RADIUS);
  const queue = [{ tileX: originTileX, tileY: originTileY, distance: 0 }];
  let queueIndex = 0;
  const visited = new Set<string>([`${originTileX}:${originTileY}`]);
  const directions = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 }
  ];

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;

    if (current.distance > 0 && isWalkableRefreshTile(current.tileX, current.tileY, runtimeGrids, parsedMap)) {
      return { tileX: current.tileX, tileY: current.tileY };
    }

    if (current.distance >= maxRadius) {
      continue;
    }

    for (const direction of directions) {
      const nextTileX = current.tileX + direction.dx;
      const nextTileY = current.tileY + direction.dy;

      if (nextTileX < 0 || nextTileY < 0 || nextTileX >= parsedMap.width || nextTileY >= parsedMap.height) {
        continue;
      }

      const key = `${nextTileX}:${nextTileY}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push({
        tileX: nextTileX,
        tileY: nextTileY,
        distance: current.distance + 1
      });
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
