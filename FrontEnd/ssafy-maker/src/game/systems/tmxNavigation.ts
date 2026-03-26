// TMX와 TSX 메타를 파싱하고 레이어/그리드/타일셋 메타를 해석하는 유틸 함수를 제공
export type ParsedTmxLayer = {
  name: string;
  visible: boolean;
  data: number[][];
};

export type ParsedTmxTilesetRef = {
  firstgid: number;
  name: string;
  source?: string;
};

export type ParsedTmxMap = {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: ParsedTmxLayer[];
  tilesets: ParsedTmxTilesetRef[];
};

export type ParsedTsxTileset = {
  name: string;
  tileWidth: number;
  tileHeight: number;
  spacing: number;
  margin: number;
  tileCount: number;
  columns: number;
  imageSource: string;
  imageWidth: number;
  imageHeight: number;
};

export function getTilesetSourceBasename(source?: string) {
  if (!source) {
    return undefined;
  }

  const normalizedSource = source.replace(/\\/g, "/");
  const sourceSegments = normalizedSource.split("/");
  const fileName = sourceSegments[sourceSegments.length - 1];

  if (!fileName) {
    return undefined;
  }

  return fileName.replace(/\.[^/.]+$/, "");
}

export type TmxAreaConfig = {
  tmxKey: string;
  collisionLayerNames: string[];
  walkableLayerNames?: string[];
  interactionLayerNames: string[];
  foregroundLayerNames: string[];
};

export type ResolvedTmxLayers = {
  collisionLayers: ParsedTmxLayer[];
  walkableLayers: ParsedTmxLayer[];
  interactionLayers: ParsedTmxLayer[];
  foregroundLayers: ParsedTmxLayer[];
};

export type TmxRuntimeGrids = {
  blockedGrid: boolean[][];
  interactionGrid: boolean[][];
  manualBlockedGrid: boolean[][];
};

export type TmxConnectedRegion = {
  tiles: { x: number; y: number }[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
};

function cloneBooleanGrid(grid: boolean[][]) {
  return grid.map((row) => [...row]);
}

function isTileInsideRect(tileX: number, tileY: number, rect: { x: number; y: number; width: number; height: number }) {
  return (
    tileX >= rect.x &&
    tileX < rect.x + rect.width &&
    tileY >= rect.y &&
    tileY < rect.y + rect.height
  );
}

export function applyWalkableTileZones(
  blockedGrid: boolean[][],
  walkableTileZones?: { x: number; y: number; width: number; height: number }[]
) {
  if (!walkableTileZones || walkableTileZones.length === 0) {
    return blockedGrid;
  }

  const nextBlockedGrid = cloneBooleanGrid(blockedGrid);

  for (let y = 0; y < nextBlockedGrid.length; y += 1) {
    for (let x = 0; x < (nextBlockedGrid[y]?.length ?? 0); x += 1) {
      const isAllowedTile = walkableTileZones.some((zone) => isTileInsideRect(x, y, zone));

      if (!isAllowedTile) {
        nextBlockedGrid[y][x] = true;
      }
    }
  }

  return nextBlockedGrid;
}

export function applyBlockedTileZones(
  blockedGrid: boolean[][],
  blockedTileZones?: { x: number; y: number; width: number; height: number }[]
) {
  if (!blockedTileZones || blockedTileZones.length === 0) {
    return blockedGrid;
  }

  const nextBlockedGrid = cloneBooleanGrid(blockedGrid);

  for (let y = 0; y < nextBlockedGrid.length; y += 1) {
    for (let x = 0; x < (nextBlockedGrid[y]?.length ?? 0); x += 1) {
      const isBlockedTile = blockedTileZones.some((zone) => isTileInsideRect(x, y, zone));

      if (isBlockedTile) {
        nextBlockedGrid[y][x] = true;
      }
    }
  }

  return nextBlockedGrid;
}

export function applyBlockedTiles(
  blockedGrid: boolean[][],
  blockedTiles?: { x: number; y: number }[]
) {
  if (!blockedTiles || blockedTiles.length === 0) {
    return blockedGrid;
  }

  const nextBlockedGrid = cloneBooleanGrid(blockedGrid);

  blockedTiles.forEach((tile) => {
    const row = nextBlockedGrid[tile.y];
    if (!row || tile.x < 0 || tile.x >= row.length) {
      return;
    }

    row[tile.x] = true;
  });

  return nextBlockedGrid;
}

function isParsedTmxTilesetRef(
  value: ParsedTmxTilesetRef | null
): value is ParsedTmxTilesetRef {
  return value !== null;
}

export function getLayerByName(parsedMap: ParsedTmxMap, layerName: string) {
  return parsedMap.layers.find(
    (layer) => layer.name.trim().toLowerCase() === layerName.trim().toLowerCase()
  );
}

export function getLayersByNames(parsedMap: ParsedTmxMap, layerNames: string[]) {
  return layerNames
    .map((layerName) => getLayerByName(parsedMap, layerName))
    .filter((layer): layer is ParsedTmxLayer => Boolean(layer));
}

function warnMissingLayerNames(parsedMap: ParsedTmxMap, layerNames: string[], groupLabel: string): void {
  const missingLayerNames = layerNames.filter((layerName) => !getLayerByName(parsedMap, layerName));
  if (missingLayerNames.length === 0) {
    return;
  }

  console.warn(
    `[TMX] Missing ${groupLabel} layers: ${missingLayerNames.join(", ")}. Available layers: ${parsedMap.layers
      .map((layer) => layer.name)
      .join(", ")}`
  );
}

export function resolveTmxLayers(
  parsedMap: ParsedTmxMap,
  areaConfig: TmxAreaConfig
): ResolvedTmxLayers {
  warnMissingLayerNames(parsedMap, areaConfig.collisionLayerNames, "collision");
  warnMissingLayerNames(parsedMap, areaConfig.walkableLayerNames ?? [], "walkable");
  warnMissingLayerNames(parsedMap, areaConfig.interactionLayerNames, "interaction");
  warnMissingLayerNames(parsedMap, areaConfig.foregroundLayerNames, "foreground");

  return {
    collisionLayers: getLayersByNames(parsedMap, areaConfig.collisionLayerNames),
    walkableLayers: getLayersByNames(parsedMap, areaConfig.walkableLayerNames ?? []),
    interactionLayers: getLayersByNames(parsedMap, areaConfig.interactionLayerNames),
    foregroundLayers: getLayersByNames(parsedMap, areaConfig.foregroundLayerNames)
  };
}

export function buildBooleanGridFromLayers(
  width: number,
  height: number,
  layers: ParsedTmxLayer[]
) {
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  for (const layer of layers) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if ((layer.data[y]?.[x] ?? 0) !== 0) {
          grid[y][x] = true;
        }
      }
    }
  }

  return grid;
}

export function buildBooleanGridFromTiles(
  width: number,
  height: number,
  blockedTiles?: { x: number; y: number }[]
) {
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  blockedTiles?.forEach((tile) => {
    const row = grid[tile.y];
    if (!row || tile.x < 0 || tile.x >= row.length) {
      return;
    }

    row[tile.x] = true;
  });

  return grid;
}

export function extractConnectedRegionsFromGrid(
  grid: boolean[][],
  minAreaTiles = 1
): TmxConnectedRegion[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  if (width === 0 || height === 0) {
    return [];
  }

  const visited = Array.from({ length: height }, () => Array.from({ length: width }, () => false));
  const regions: TmxConnectedRegion[] = [];
  const directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!grid[y]?.[x] || visited[y][x]) {
        continue;
      }

      const queue: Array<{ x: number; y: number }> = [{ x, y }];
      const tiles: Array<{ x: number; y: number }> = [];
      visited[y][x] = true;
      let queueIndex = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;

      while (queueIndex < queue.length) {
        const current = queue[queueIndex];
        queueIndex += 1;
        tiles.push(current);
        minX = Math.min(minX, current.x);
        maxX = Math.max(maxX, current.x);
        minY = Math.min(minY, current.y);
        maxY = Math.max(maxY, current.y);
        sumX += current.x;
        sumY += current.y;

        directions.forEach(([dx, dy]) => {
          const nextX = current.x + dx;
          const nextY = current.y + dy;

          if (
            nextX < 0 ||
            nextY < 0 ||
            nextX >= width ||
            nextY >= height ||
            visited[nextY][nextX] ||
            !grid[nextY]?.[nextX]
          ) {
            return;
          }

          visited[nextY][nextX] = true;
          queue.push({ x: nextX, y: nextY });
        });
      }

      if (tiles.length < minAreaTiles) {
        continue;
      }

      regions.push({
        tiles,
        minX,
        maxX,
        minY,
        maxY,
        centerX: sumX / tiles.length,
        centerY: sumY / tiles.length
      });
    }
  }

  return regions;
}

export function buildAdjacentWalkableTiles(
  region: TmxConnectedRegion,
  blockedGrid: boolean[][]
) {
  const height = blockedGrid.length;
  const width = blockedGrid[0]?.length ?? 0;

  if (width === 0 || height === 0) {
    return [];
  }

  const regionKeys = new Set(region.tiles.map((tile) => `${tile.x},${tile.y}`));
  const adjacentKeys = new Set<string>();
  const adjacentTiles: Array<{ x: number; y: number }> = [];
  const directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  region.tiles.forEach((tile) => {
    directions.forEach(([dx, dy]) => {
      const nextX = tile.x + dx;
      const nextY = tile.y + dy;
      const key = `${nextX},${nextY}`;

      if (
        nextX < 0 ||
        nextY < 0 ||
        nextX >= width ||
        nextY >= height ||
        regionKeys.has(key) ||
        blockedGrid[nextY]?.[nextX] ||
        adjacentKeys.has(key)
      ) {
        return;
      }

      adjacentKeys.add(key);
      adjacentTiles.push({ x: nextX, y: nextY });
    });
  });

  return adjacentTiles;
}

export function buildRuntimeGrids(
  parsedMap: ParsedTmxMap,
  resolvedLayers: ResolvedTmxLayers,
  walkableTileZones?: { x: number; y: number; width: number; height: number }[],
  blockedTileZones?: { x: number; y: number; width: number; height: number }[],
  blockedTiles?: { x: number; y: number }[]
): TmxRuntimeGrids {
  const baseBlockedGrid = buildBooleanGridFromLayers(
    parsedMap.width,
    parsedMap.height,
    resolvedLayers.collisionLayers
  );
  const walkableAppliedBlockedGrid = applyWalkableTileZones(baseBlockedGrid, walkableTileZones);
  // walkable patch only relaxes base collision-derived blocking.
  // Manual blocked zones / tiles remain the final authority.
  const walkablePatchGrid = buildBooleanGridFromLayers(
    parsedMap.width,
    parsedMap.height,
    resolvedLayers.walkableLayers
  );
  const walkableLayerAppliedBlockedGrid = cloneBooleanGrid(walkableAppliedBlockedGrid);
  for (let y = 0; y < walkableLayerAppliedBlockedGrid.length; y += 1) {
    for (let x = 0; x < (walkableLayerAppliedBlockedGrid[y]?.length ?? 0); x += 1) {
      if (walkablePatchGrid[y]?.[x]) {
        walkableLayerAppliedBlockedGrid[y][x] = false;
      }
    }
  }
  const zoneAppliedBlockedGrid = applyBlockedTileZones(
    walkableLayerAppliedBlockedGrid,
    blockedTileZones
  );
  const finalBlockedGrid = applyBlockedTiles(zoneAppliedBlockedGrid, blockedTiles);
  const manualBlockedGrid = buildBooleanGridFromTiles(parsedMap.width, parsedMap.height, blockedTiles);

  return {
    blockedGrid: finalBlockedGrid,
    interactionGrid: buildBooleanGridFromLayers(
      parsedMap.width,
      parsedMap.height,
      resolvedLayers.interactionLayers
    ),
    manualBlockedGrid
  };
}

export function countTrueCells(grid: boolean[][]) {
  let count = 0;

  for (const row of grid) {
    for (const cell of row) {
      if (cell) {
        count += 1;
      }
    }
  }

  return count;
}

export function findFirstWalkableTile(blockedGrid: boolean[][]) {
  for (let y = 0; y < blockedGrid.length; y += 1) {
    for (let x = 0; x < (blockedGrid[y]?.length ?? 0); x += 1) {
      if (!blockedGrid[y][x]) {
        return { tileX: x, tileY: y };
      }
    }
  }

  return { tileX: 0, tileY: 0 };
}

export function parseTmxMap(rawTmx: string): ParsedTmxMap | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawTmx, "application/xml");

  if (doc.getElementsByTagName("parsererror").length > 0) {
    return null;
  }

  const mapNode = doc.getElementsByTagName("map")[0];
  if (!mapNode) {
    return null;
  }

  const width = Number.parseInt(mapNode.getAttribute("width") ?? "0", 10);
  const height = Number.parseInt(mapNode.getAttribute("height") ?? "0", 10);
  const tileWidth = Number.parseInt(mapNode.getAttribute("tilewidth") ?? "32", 10);
  const tileHeight = Number.parseInt(mapNode.getAttribute("tileheight") ?? "32", 10);

  if (width <= 0 || height <= 0) {
    return null;
  }

  const tilesets = Array.from(mapNode.getElementsByTagName("tileset"))
    .map((tilesetNode, index): ParsedTmxTilesetRef | null => {
      const firstgid = Number.parseInt(
        tilesetNode.getAttribute("firstgid") ?? `${index + 1}`,
        10
      );
      const name =
        tilesetNode.getAttribute("name") ??
        tilesetNode.getAttribute("source") ??
        `tileset_${index + 1}`;
      const sourceAttr = tilesetNode.getAttribute("source");

      if (!Number.isFinite(firstgid)) {
        return null;
      }

      const tilesetRef: ParsedTmxTilesetRef = {
        firstgid,
        name
      };

      if (sourceAttr) {
        tilesetRef.source = sourceAttr;
      }

      return tilesetRef;
    })
    .filter(isParsedTmxTilesetRef)
    .sort((a, b) => a.firstgid - b.firstgid);

  const layers: ParsedTmxLayer[] = [];
  let hasInvalidLayerData = false;

  Array.from(mapNode.getElementsByTagName("layer")).forEach((layerNode, index) => {
    if (hasInvalidLayerData) {
      return;
    }

    const dataNode = layerNode.getElementsByTagName("data")[0];
    if (!dataNode) {
      return;
    }

    const encoding = dataNode.getAttribute("encoding");
    if (encoding !== "csv") {
      return;
    }

    const values = (dataNode.textContent ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed)) {
          return 0;
        }

        return (parsed >>> 0) & 0x1fffffff;
      });

    const requiredCellCount = width * height;
    if (values.length !== requiredCellCount) {
      console.error(
        `[TMX] Invalid CSV cell count for layer "${layerNode.getAttribute("name") ?? `layer_${index + 1}`}". ` +
          `Expected ${requiredCellCount}, received ${values.length}.`
      );
      hasInvalidLayerData = true;
      return;
    }

    const rowData: number[][] = [];
    for (let y = 0; y < height; y += 1) {
      const start = y * width;
      rowData.push(values.slice(start, start + width));
    }

    layers.push({
      name: layerNode.getAttribute("name") ?? `layer_${index + 1}`,
      visible: layerNode.getAttribute("visible") !== "0",
      data: rowData
    });
  });

  if (hasInvalidLayerData) {
    return null;
  }

  return {
    width,
    height,
    tileWidth,
    tileHeight,
    layers,
    tilesets
  };
}

export function parseTsxTileset(rawTsx: string): ParsedTsxTileset | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawTsx, "application/xml");

  if (doc.getElementsByTagName("parsererror").length > 0) {
    return null;
  }

  const tilesetNode = doc.getElementsByTagName("tileset")[0];
  const imageNode = doc.getElementsByTagName("image")[0];

  if (!tilesetNode || !imageNode) {
    return null;
  }

  const tileWidth = Number.parseInt(tilesetNode.getAttribute("tilewidth") ?? "0", 10);
  const tileHeight = Number.parseInt(tilesetNode.getAttribute("tileheight") ?? "0", 10);

  if (tileWidth <= 0 || tileHeight <= 0) {
    return null;
  }

  return {
    name: tilesetNode.getAttribute("name") ?? "tileset",
    tileWidth,
    tileHeight,
    spacing: Number.parseInt(tilesetNode.getAttribute("spacing") ?? "0", 10),
    margin: Number.parseInt(tilesetNode.getAttribute("margin") ?? "0", 10),
    tileCount: Number.parseInt(tilesetNode.getAttribute("tilecount") ?? "0", 10),
    columns: Number.parseInt(tilesetNode.getAttribute("columns") ?? "0", 10),
    imageSource: imageNode.getAttribute("source") ?? "",
    imageWidth: Number.parseInt(imageNode.getAttribute("width") ?? "0", 10),
    imageHeight: Number.parseInt(imageNode.getAttribute("height") ?? "0", 10)
  };
}
