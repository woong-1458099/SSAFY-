// TMX 맵 파싱과 레이어 조회에 사용할 기본 타입과 유틸 함수를 제공
export type ParsedTmxLayer = {
  name: string;
  visible: boolean;
  data: number[][];
};

export type ParsedTmxMap = {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: ParsedTmxLayer[];
};

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
        return Number.isFinite(parsed) ? parsed : 0;
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
    layers
  };
}
