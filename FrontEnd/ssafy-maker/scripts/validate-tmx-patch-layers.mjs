import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const TMX_TARGETS = [
  {
    file: "public/assets/game/map/classroom.tmx",
    requiredLayers: ["collision(patch)", "walkable(patch)"]
  },
  {
    file: "public/assets/game/map/mainMap.tmx",
    requiredLayers: ["collision(patch)", "interaction(patch)"]
  }
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: false,
  parseTagValue: false
});

function asArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function parseMap(xml, file) {
  const parsed = xmlParser.parse(xml)?.map;
  if (!parsed) {
    throw new Error(`[validate-tmx-patch-layers] Failed to parse TMX root in ${file}`);
  }

  const width = Number(parsed["@_width"] ?? 0);
  const height = Number(parsed["@_height"] ?? 0);

  if (width <= 0 || height <= 0) {
    throw new Error(`[validate-tmx-patch-layers] Invalid map size in ${file}`);
  }

  return {
    width,
    height,
    layers: asArray(parsed.layer)
  };
}

function findCsvLayer(layers, layerName) {
  return layers.find((layer) => {
    if (String(layer?.["@_name"] ?? "").trim() !== layerName) {
      return false;
    }

    const encoding =
      typeof layer?.data === "string"
        ? "csv"
        : String(layer?.data?.["@_encoding"] ?? "").trim().toLowerCase();

    return encoding === "csv";
  });
}

function getCsvText(layer) {
  if (typeof layer?.data === "string") {
    return layer.data;
  }

  return layer?.data?.["#text"];
}

function countCsvCells(csvText) {
  return String(csvText ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0).length;
}

let hasError = false;

TMX_TARGETS.forEach(({ file, requiredLayers }) => {
  let map;
  try {
    const absolutePath = path.resolve(file);
    const xml = fs.readFileSync(absolutePath, "utf8");
    map = parseMap(xml, file);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      message.startsWith("[validate-tmx-patch-layers]")
        ? message
        : `[validate-tmx-patch-layers] ${message}`
    );
    hasError = true;
    return;
  }

  const expectedCellCount = map.width * map.height;

  requiredLayers.forEach((layerName) => {
    const layer = findCsvLayer(map.layers, layerName);
    if (!layer) {
      console.error(`[validate-tmx-patch-layers] Missing layer "${layerName}" in ${file}`);
      hasError = true;
      return;
    }

    const actualCellCount = countCsvCells(getCsvText(layer));
    if (actualCellCount !== expectedCellCount) {
      console.error(
        `[validate-tmx-patch-layers] Invalid CSV cell count for ${file} :: ${layerName}. ` +
          `Expected ${expectedCellCount}, received ${actualCellCount}.`
      );
      hasError = true;
    }
  });
});

if (hasError) {
  process.exit(1);
}

console.log("[validate-tmx-patch-layers] OK");
