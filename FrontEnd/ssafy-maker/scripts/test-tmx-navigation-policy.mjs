import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "src", "game", "systems", "tmxNavigation.ts");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ssafy-maker-tmx-navigation-"));
const transpiledModulePath = path.join(tempDir, "tmxNavigation.mjs");

process.on("exit", () => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

const transpiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020
  },
  fileName: sourcePath
});

fs.writeFileSync(transpiledModulePath, transpiled.outputText, "utf8");

const { buildRuntimeGrids } = await import(`${pathToFileURL(transpiledModulePath).href}?t=${Date.now()}`);

function createLayer(name, filled) {
  return {
    name,
    visible: true,
    data: [[filled ? 1 : 0]]
  };
}

function runBlockedCase({
  collisionFilled = true,
  walkablePatchFilled = false,
  walkableTileZones,
  blockedTileZones,
  blockedTiles
}) {
  const parsedMap = {
    width: 1,
    height: 1,
    tileWidth: 32,
    tileHeight: 32,
    layers: [],
    tilesets: []
  };
  const resolvedLayers = {
    collisionLayers: [createLayer("collision", collisionFilled)],
    walkableLayers: [createLayer("walkable(patch)", walkablePatchFilled)],
    interactionLayers: [],
    foregroundLayers: []
  };

  return buildRuntimeGrids(
    parsedMap,
    resolvedLayers,
    walkableTileZones,
    blockedTileZones,
    blockedTiles
  ).blockedGrid[0][0];
}

const cases = [
  {
    name: "walkable patch clears collision-derived blocking",
    actual: runBlockedCase({ walkablePatchFilled: true }),
    expected: false
  },
  {
    name: "manual blocked zone overrides walkable patch",
    actual: runBlockedCase({
      walkablePatchFilled: true,
      blockedTileZones: [{ x: 0, y: 0, width: 1, height: 1 }]
    }),
    expected: true
  },
  {
    name: "manual blocked tile overrides walkable patch",
    actual: runBlockedCase({
      walkablePatchFilled: true,
      blockedTiles: [{ x: 0, y: 0 }]
    }),
    expected: true
  },
  {
    name: "walkable patch does not bypass walkable zone restriction",
    actual: runBlockedCase({
      walkablePatchFilled: true,
      walkableTileZones: [{ x: 1, y: 1, width: 1, height: 1 }]
    }),
    expected: true
  }
];

cases.forEach(({ name, actual, expected }) => {
  assert.equal(actual, expected, name);
});

console.log(`[test:tmx-navigation-policy] OK (${cases.length} cases)`);
