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
  interactionLayerNames: string[];
  foregroundLayerNames: string[];
};

export type ResolvedTmxLayers = {
  collisionLayers: ParsedTmxLayer[];
  interactionLayers: ParsedTmxLayer[];
  foregroundLayers: ParsedTmxLayer[];
};

export type TmxRuntimeGrids = {
  blockedGrid: boolean[][];
  interactionGrid: boolean[][];
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

export function resolveTmxLayers(
  parsedMap: ParsedTmxMap,
  areaConfig: TmxAreaConfig
): ResolvedTmxLayers {
  return {
    collisionLayers: getLayersByNames(parsedMap, areaConfig.collisionLayerNames),
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

export function buildRuntimeGrids(
  parsedMap: ParsedTmxMap,
  resolvedLayers: ResolvedTmxLayers,
  walkableTileZones?: { x: number; y: number; width: number; height: number }[],
  blockedTileZones?: { x: number; y: number; width: number; height: number }[]
): TmxRuntimeGrids {
  const baseBlockedGrid = buildBooleanGridFromLayers(
    parsedMap.width,
    parsedMap.height,
    resolvedLayers.collisionLayers
  );
  const walkableAppliedBlockedGrid = applyWalkableTileZones(baseBlockedGrid, walkableTileZones);

  return {
    blockedGrid: applyBlockedTileZones(walkableAppliedBlockedGrid, blockedTileZones),
    interactionGrid: buildBooleanGridFromLayers(
      parsedMap.width,
      parsedMap.height,
      resolvedLayers.interactionLayers
    )
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

  Array.from(mapNode.getElementsByTagName("layer")).forEach((layerNode, index) => {
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
    while (values.length < requiredCellCount) {
      values.push(0);
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
