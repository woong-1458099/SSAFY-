import fs from "node:fs";
import path from "node:path";

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

function parseMapSize(xml) {
  const mapTag = xml.match(/<map\b[^>]*>/i)?.[0] ?? "";
  const width = Number((mapTag.match(/\bwidth="(\d+)"/i) ?? [])[1] ?? 0);
  const height = Number((mapTag.match(/\bheight="(\d+)"/i) ?? [])[1] ?? 0);
  return { width, height };
}

function extractCsvLayer(xml, layerName) {
  const escapedName = layerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<layer[^>]*name="${escapedName}"[^>]*>[\\s\\S]*?<data[^>]*encoding="csv"[^>]*>([\\s\\S]*?)<\\/data>[\\s\\S]*?<\\/layer>`,
    "i"
  );
  const match = xml.match(pattern);
  return match?.[1];
}

function countCsvCells(csvText) {
  return csvText
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0).length;
}

let hasError = false;

TMX_TARGETS.forEach(({ file, requiredLayers }) => {
  const absolutePath = path.resolve(file);
  const xml = fs.readFileSync(absolutePath, "utf8");
  const { width, height } = parseMapSize(xml);
  const expectedCellCount = width * height;

  if (width <= 0 || height <= 0) {
    console.error(`[validate-tmx-patch-layers] Invalid map size in ${file}`);
    hasError = true;
    return;
  }

  requiredLayers.forEach((layerName) => {
    const csvText = extractCsvLayer(xml, layerName);
    if (!csvText) {
      console.error(`[validate-tmx-patch-layers] Missing layer "${layerName}" in ${file}`);
      hasError = true;
      return;
    }

    const actualCellCount = countCsvCells(csvText);
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
