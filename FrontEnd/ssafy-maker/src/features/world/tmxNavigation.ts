import Phaser from "phaser";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";

export type ParsedTmxLayer = {
  name: string;
  visible: boolean;
  data: number[][];
};

export type TmxSemanticCode = 0 | 1 | 2;

export type TmxRegion = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
  centerX: number;
  centerY: number;
};

export type InteractionZone = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type ParsedTmxMap = {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesets: Array<{ firstgid: number; name: string }>;
  layers: ParsedTmxLayer[];
};

export type AreaRenderBounds = Phaser.Geom.Rectangle | null;

export type AreaCollisionConfig = {
  bounds: Phaser.Geom.Rectangle;
  mapWidth: number;
  mapHeight: number;
  tileWidth: number;
  tileHeight: number;
  tileCodes: TmxSemanticCode[][];
  blocked: boolean[][];
};

export function parseTmxMap(rawTmx: string): ParsedTmxMap | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawTmx, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    return null;
  }

  const mapNode = doc.getElementsByTagName("map")[0];
  if (!mapNode) return null;

  const width = Number.parseInt(mapNode.getAttribute("width") ?? "0", 10);
  const height = Number.parseInt(mapNode.getAttribute("height") ?? "0", 10);
  const tileWidth = Number.parseInt(mapNode.getAttribute("tilewidth") ?? "32", 10);
  const tileHeight = Number.parseInt(mapNode.getAttribute("tileheight") ?? "32", 10);
  if (width <= 0 || height <= 0 || tileWidth <= 0 || tileHeight <= 0) return null;

  const tilesets = Array.from(mapNode.getElementsByTagName("tileset"))
    .map((tilesetNode, idx) => {
      const firstgid = Number.parseInt(tilesetNode.getAttribute("firstgid") ?? `${idx + 1}`, 10);
      const name = tilesetNode.getAttribute("name") ?? tilesetNode.getAttribute("source") ?? `tileset_${idx + 1}`;
      if (!Number.isFinite(firstgid)) return null;
      return { firstgid, name };
    })
    .filter((tileset): tileset is { firstgid: number; name: string } => Boolean(tileset))
    .sort((a, b) => a.firstgid - b.firstgid);

  const layers: ParsedTmxLayer[] = [];
  Array.from(mapNode.getElementsByTagName("layer")).forEach((layerNode, idx) => {
    const dataNode = layerNode.getElementsByTagName("data")[0];
    if (!dataNode) return;
    const encoding = dataNode.getAttribute("encoding");
    if (encoding !== "csv") return;

    const values = (dataNode.textContent ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => {
        const parsedValue = Number.parseInt(value, 10);
        if (!Number.isFinite(parsedValue)) return 0;
        const gid = (parsedValue >>> 0) & 0x1fffffff;
        return gid;
      });

    const required = width * height;
    if (values.length < required) {
      values.push(...Array.from({ length: required - values.length }, () => 0));
    }

    const rowData: number[][] = [];
    for (let y = 0; y < height; y += 1) {
      const start = y * width;
      rowData.push(values.slice(start, start + width));
    }

    layers.push({
      name: layerNode.getAttribute("name") ?? `layer_${idx + 1}`,
      visible: layerNode.getAttribute("visible") !== "0",
      data: rowData
    });
  });

  if (layers.length === 0) return null;
  return { width, height, tileWidth, tileHeight, tilesets, layers };
}

function combineLayersByNames(parsed: ParsedTmxMap, layerNames: string[]): number[][] | null {
  const names = new Set(layerNames.map((name) => name.trim().toLowerCase()));
  const layers = parsed.layers.filter((layer) => names.has(layer.name.trim().toLowerCase()));
  if (layers.length === 0) return null;
  const combined = Array.from({ length: parsed.height }, () => Array.from({ length: parsed.width }, () => 0));
  layers.forEach((layer) => {
    for (let y = 0; y < parsed.height; y += 1) {
      for (let x = 0; x < parsed.width; x += 1) {
        if ((layer.data[y]?.[x] ?? 0) !== 0) combined[y][x] = 1;
      }
    }
  });
  return combined;
}

function extractTmxConnectedRegions(data: number[][], minAreaTiles: number): TmxRegion[] {
  const height = data.length;
  if (height === 0) return [];
  const width = data[0]?.length ?? 0;
  if (width === 0) return [];

  const visited = Array.from({ length: height }, () => Array.from({ length: width }, () => false));
  const dirs: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  const regions: TmxRegion[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (visited[y][x] || data[y][x] === 0) continue;

      const queue: Array<[number, number]> = [[x, y]];
      visited[y][x] = true;
      let qi = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;
      let sumX = 0;
      let sumY = 0;

      while (qi < queue.length) {
        const [cx, cy] = queue[qi];
        qi += 1;
        area += 1;
        sumX += cx;
        sumY += cy;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        dirs.forEach(([dx, dy]) => {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
          if (visited[ny][nx] || data[ny][nx] === 0) return;
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        });
      }

      if (area >= minAreaTiles) {
        regions.push({
          minX,
          maxX,
          minY,
          maxY,
          area,
          centerX: sumX / area,
          centerY: sumY / area
        });
      }
    }
  }

  return regions;
}

export function screenPointToMapTile(
  screenX: number,
  screenY: number,
  bounds: Phaser.Geom.Rectangle,
  parsed: Pick<ParsedTmxMap, "width" | "height" | "tileWidth" | "tileHeight">
): { tileX: number; tileY: number } {
  const mapPixelWidth = parsed.width * parsed.tileWidth;
  const mapPixelHeight = parsed.height * parsed.tileHeight;
  const localX = Phaser.Math.Clamp((screenX - bounds.x) / bounds.width, 0, 0.9999) * mapPixelWidth;
  const localY = Phaser.Math.Clamp((screenY - bounds.y) / bounds.height, 0, 0.9999) * mapPixelHeight;
  return {
    tileX: Math.floor(localX / parsed.tileWidth),
    tileY: Math.floor(localY / parsed.tileHeight)
  };
}

function expandInteractionRegions<T extends string>(
  regions: TmxRegion[],
  targets: Record<T, { tileX: number; tileY: number }>
): TmxRegion[] {
  const expanded: TmxRegion[] = [];

  regions.forEach((region) => {
    const targetValues = Object.values(targets) as Array<{ tileX: number; tileY: number }>;
    const containedTargets = targetValues
      .filter(
        (target) =>
          target.tileX >= region.minX &&
          target.tileX <= region.maxX &&
          target.tileY >= region.minY &&
          target.tileY <= region.maxY
      )
      .sort((a, b) => a.tileX - b.tileX);

    if (containedTargets.length <= 1 || region.maxX <= region.minX) {
      expanded.push(region);
      return;
    }

    const splitEdges = [region.minX];
    for (let i = 0; i < containedTargets.length - 1; i += 1) {
      splitEdges.push(Math.floor((containedTargets[i].tileX + containedTargets[i + 1].tileX) / 2));
    }
    splitEdges.push(region.maxX + 1);

    for (let i = 0; i < containedTargets.length; i += 1) {
      const minX = splitEdges[i];
      const maxX = splitEdges[i + 1] - 1;
      const centerX = (minX + maxX) / 2;
      expanded.push({
        minX,
        maxX,
        minY: region.minY,
        maxY: region.maxY,
        area: Math.max(1, (maxX - minX + 1) * (region.maxY - region.minY + 1)),
        centerX,
        centerY: region.centerY
      });
    }
  });

  return expanded;
}

export function buildInteractionZonesFromTmxText<T extends string>(
  tmxText: string,
  bounds: AreaRenderBounds,
  layerNames: string[],
  targets: Array<{ id: T; x: number; y: number }>,
  minAreaTiles: number,
  maxAreaTiles: number
): Partial<Record<T, InteractionZone>> | null {
  if (!bounds || tmxText.length === 0) return null;
  const parsed = parseTmxMap(tmxText);
  if (!parsed) return null;

  const combined = combineLayersByNames(parsed, layerNames);
  if (!combined) return null;
  const targetIds = targets.map((target) => target.id);
  const baseTargets = targets.reduce(
    (acc, target) => {
      acc[target.id] = screenPointToMapTile(target.x, target.y, bounds, parsed);
      return acc;
    },
    {} as Record<T, { tileX: number; tileY: number }>
  );

  const regions = expandInteractionRegions(
    extractTmxConnectedRegions(combined, minAreaTiles).filter((region) => region.area >= minAreaTiles && region.area <= maxAreaTiles),
    baseTargets
  );
  if (regions.length === 0) return null;

  const mapPixelWidth = parsed.width * parsed.tileWidth;
  const mapPixelHeight = parsed.height * parsed.tileHeight;
  const scaleX = bounds.width / mapPixelWidth;
  const scaleY = bounds.height / mapPixelHeight;

  const remaining = [...regions];
  const zones: Partial<Record<T, InteractionZone>> = {};

  targetIds.forEach((id) => {
    const target = baseTargets[id];
    if (!target || remaining.length === 0) return;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    remaining.forEach((region, idx) => {
      const dx = region.centerX - target.tileX;
      const dy = region.centerY - target.tileY;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    const [region] = remaining.splice(bestIdx, 1);
    if (!region) return;

    const paddingTiles = 0.35;
    const minTileX = Math.max(0, region.minX - paddingTiles);
    const maxTileX = Math.min(parsed.width, region.maxX + 1 + paddingTiles);
    const minTileY = Math.max(0, region.minY - paddingTiles);
    const maxTileY = Math.min(parsed.height, region.maxY + 1 + paddingTiles);
    const x = bounds.x + minTileX * parsed.tileWidth * scaleX;
    const y = bounds.y + minTileY * parsed.tileHeight * scaleY;
    const width = (maxTileX - minTileX) * parsed.tileWidth * scaleX;
    const height = (maxTileY - minTileY) * parsed.tileHeight * scaleY;
    zones[id] = {
      centerX: x + width / 2,
      centerY: y + height / 2,
      width,
      height
    };
  });

  return zones;
}

export function buildAreaCollisionConfigFromTmxText(
  tmxText: string,
  bounds: Phaser.Geom.Rectangle,
  layerNames: string[]
): AreaCollisionConfig | null {
  if (tmxText.length === 0) return null;
  const parsed = parseTmxMap(tmxText);
  if (!parsed) return null;
  const combined = combineLayersByNames(parsed, layerNames);
  if (!combined) return null;

  return {
    bounds,
    mapWidth: parsed.width,
    mapHeight: parsed.height,
    tileWidth: parsed.tileWidth,
    tileHeight: parsed.tileHeight,
    tileCodes: combined.map((row) => row.map((cell) => (cell !== 0 ? 1 : (0 as TmxSemanticCode)))),
    blocked: combined.map((row) => row.map((cell) => cell !== 0))
  };
}

export function findNearestWalkablePoint(
  config: AreaCollisionConfig | undefined,
  desiredX: number,
  desiredY: number,
  roundCoord: (value: number) => number = (value) => value
): { x: number; y: number } {
  if (!config) {
    return { x: roundCoord(desiredX), y: roundCoord(desiredY) };
  }

  const desiredTile = screenPointToMapTile(desiredX, desiredY, config.bounds, {
    width: config.mapWidth,
    height: config.mapHeight,
    tileWidth: config.tileWidth,
    tileHeight: config.tileHeight
  });

  const clampTileX = Phaser.Math.Clamp(desiredTile.tileX, 0, config.mapWidth - 1);
  const clampTileY = Phaser.Math.Clamp(desiredTile.tileY, 0, config.mapHeight - 1);
  if (!config.blocked[clampTileY]?.[clampTileX]) {
    return { x: roundCoord(desiredX), y: roundCoord(desiredY) };
  }

  const maxRadius = Math.max(config.mapWidth, config.mapHeight);
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let tileY = Math.max(0, clampTileY - radius); tileY <= Math.min(config.mapHeight - 1, clampTileY + radius); tileY += 1) {
      for (let tileX = Math.max(0, clampTileX - radius); tileX <= Math.min(config.mapWidth - 1, clampTileX + radius); tileX += 1) {
        if (config.blocked[tileY]?.[tileX]) continue;

        const screenX = config.bounds.x + ((tileX + 0.5) * config.tileWidth * config.bounds.width) / (config.mapWidth * config.tileWidth);
        const screenY = config.bounds.y + ((tileY + 0.5) * config.tileHeight * config.bounds.height) / (config.mapHeight * config.tileHeight);
        return { x: roundCoord(screenX), y: roundCoord(screenY) };
      }
    }
  }

  return { x: roundCoord(desiredX), y: roundCoord(desiredY) };
}

export function isBlockedByAreaCollision(config: AreaCollisionConfig | undefined, x: number, y: number): boolean {
  if (!config) return false;
  const { bounds, mapWidth, mapHeight, tileWidth, tileHeight, blocked } = config;
  const mapPixelWidth = mapWidth * tileWidth;
  const mapPixelHeight = mapHeight * tileHeight;
  const localX = ((x - bounds.x) / bounds.width) * mapPixelWidth;
  const localY = ((y - bounds.y) / bounds.height) * mapPixelHeight;
  const tileX = Math.floor(localX / tileWidth);
  const tileY = Math.floor(localY / tileHeight);
  if (tileX < 0 || tileY < 0 || tileX >= mapWidth || tileY >= mapHeight) return false;
  return Boolean(blocked[tileY]?.[tileX]);
}

export function mapPointToAreaBounds(
  x: number,
  y: number,
  bounds: AreaRenderBounds,
  roundCoord: (value: number) => number = (value) => value
): { x: number; y: number } {
  if (!bounds) {
    return { x: roundCoord(x), y: roundCoord(y) };
  }
  return {
    x: roundCoord(bounds.x + (x / GAME_CONSTANTS.WIDTH) * bounds.width),
    y: roundCoord(bounds.y + (y / GAME_CONSTANTS.HEIGHT) * bounds.height)
  };
}

export function mapSizeToAreaBounds(
  width: number,
  height: number,
  bounds: AreaRenderBounds,
  roundCoord: (value: number) => number = (value) => value
): { width: number; height: number } {
  if (!bounds) {
    return { width: roundCoord(width), height: roundCoord(height) };
  }
  return {
    width: roundCoord((width / GAME_CONSTANTS.WIDTH) * bounds.width),
    height: roundCoord((height / GAME_CONSTANTS.HEIGHT) * bounds.height)
  };
}
