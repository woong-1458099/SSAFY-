import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const areaDefinitionsPath = path.join(projectRoot, "src", "game", "definitions", "areas", "areaDefinitions.ts");
const assetKeysPath = path.join(projectRoot, "src", "common", "assets", "assetKeys.ts");
const REQUIRED_LAYER_GROUP_NAMES = [
  "collisionLayerNames",
  "walkableLayerNames",
  "interactionLayerNames",
  "foregroundLayerNames"
];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: false,
  parseTagValue: false
});

function readSourceFile(filePath) {
  return ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true);
}

function unwrapExpression(expression) {
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function getPropertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return null;
}

function getPropertyAccessChain(expression) {
  const unwrapped = unwrapExpression(expression);
  if (ts.isIdentifier(unwrapped)) {
    return unwrapped.text;
  }

  if (!ts.isPropertyAccessExpression(unwrapped)) {
    return null;
  }

  const parentChain = getPropertyAccessChain(unwrapped.expression);
  if (!parentChain) {
    return null;
  }

  return `${parentChain}.${unwrapped.name.text}`;
}

function getObjectPropertyInitializer(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find(
    (entry) =>
      ts.isPropertyAssignment(entry) &&
      getPropertyNameText(entry.name) === propertyName
  );

  if (!property || !ts.isPropertyAssignment(property)) {
    return undefined;
  }

  return property.initializer;
}

function resolveStringArrayLiteral(expression) {
  const unwrapped = unwrapExpression(expression);
  if (!ts.isArrayLiteralExpression(unwrapped)) {
    return null;
  }

  const values = [];
  for (const element of unwrapped.elements) {
    const item = unwrapExpression(element);
    if (!ts.isStringLiteral(item) && !ts.isNoSubstitutionTemplateLiteral(item)) {
      return null;
    }

    values.push(item.text);
  }

  return values;
}

function collectExportedObjectLeafEntries(filePath, exportName) {
  const sourceFile = readSourceFile(filePath);

  function collectEntries(expression, prefix = []) {
    const unwrapped = unwrapExpression(expression);

    if (ts.isStringLiteral(unwrapped) || ts.isNoSubstitutionTemplateLiteral(unwrapped)) {
      return [{
        chain: prefix.join("."),
        value: unwrapped.text
      }];
    }

    if (!ts.isObjectLiteralExpression(unwrapped)) {
      return [];
    }

    return unwrapped.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) {
        return [];
      }

      const propertyName = getPropertyNameText(property.name);
      if (!propertyName) {
        return [];
      }

      return collectEntries(property.initializer, [...prefix, propertyName]);
    });
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) {
        continue;
      }

      return collectEntries(declaration.initializer);
    }
  }

  return [];
}

function collectExportedStringArrayObjects(filePath) {
  const sourceFile = readSourceFile(filePath);
  const results = new Map();

  sourceFile.statements.forEach((statement) => {
    if (!ts.isVariableStatement(statement)) {
      return;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      return;
    }

    statement.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name) || !declaration.name.text.endsWith("_TMX_LAYER_NAMES") || !declaration.initializer) {
        return;
      }

      const initializer = unwrapExpression(declaration.initializer);
      if (!ts.isObjectLiteralExpression(initializer)) {
        return;
      }

      const objectValue = {};
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) {
          continue;
        }

        const propertyName = getPropertyNameText(property.name);
        if (!propertyName) {
          continue;
        }

        const resolvedArray = resolveStringArrayLiteral(property.initializer);
        if (!resolvedArray) {
          throw new Error(
            `[validate-tmx-patch-layers] Failed to resolve ${declaration.name.text}.${propertyName} in areaDefinitions.ts`
          );
        }

        objectValue[propertyName] = resolvedArray;
      }

      results.set(declaration.name.text, objectValue);
    });
  });

  return results;
}

function resolveStringExpression(expression, env) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isStringLiteral(unwrapped) || ts.isNoSubstitutionTemplateLiteral(unwrapped)) {
    return unwrapped.text;
  }

  const chain = getPropertyAccessChain(unwrapped);
  if (!chain) {
    return null;
  }

  const resolved = env.get(chain);
  return typeof resolved === "string" ? resolved : null;
}

function resolveStringArrayExpression(expression, env) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isArrayLiteralExpression(unwrapped)) {
    const values = [];

    for (const element of unwrapped.elements) {
      if (ts.isSpreadElement(element)) {
        const resolvedSpread = resolveStringArrayExpression(element.expression, env);
        if (!resolvedSpread) {
          return null;
        }

        values.push(...resolvedSpread);
        continue;
      }

      const resolvedValue = resolveStringExpression(element, env);
      if (resolvedValue === null) {
        return null;
      }

      values.push(resolvedValue);
    }

    return values;
  }

  const chain = getPropertyAccessChain(unwrapped);
  if (!chain) {
    return null;
  }

  const resolved = env.get(chain);
  return Array.isArray(resolved) ? resolved : null;
}

function buildPatchTargetEnv() {
  const env = new Map();

  collectExportedObjectLeafEntries(assetKeysPath, "ASSET_KEYS").forEach(({ chain, value }) => {
    env.set(`ASSET_KEYS.${chain}`, value);
  });

  collectExportedStringArrayObjects(areaDefinitionsPath).forEach((groups, exportName) => {
    Object.entries(groups).forEach(([groupName, values]) => {
      env.set(`${exportName}.${groupName}`, values);
    });
  });

  return env;
}

function buildAssetPathByKey() {
  const assetKeyEntries = collectExportedObjectLeafEntries(assetKeysPath, "ASSET_KEYS")
    .filter(({ chain }) => chain.startsWith("map."));
  const assetPathEntries = collectExportedObjectLeafEntries(assetKeysPath, "ASSET_PATHS")
    .filter(({ chain }) => chain.startsWith("map."));
  const assetPathByMapName = new Map(
    assetPathEntries.map(({ chain, value }) => [chain.replace(/^map\./, ""), value])
  );
  const assetPathByKey = new Map();

  assetKeyEntries.forEach(({ chain, value }) => {
    const mapName = chain.replace(/^map\./, "");
    const assetPath = assetPathByMapName.get(mapName);
    if (assetPath) {
      assetPathByKey.set(value, assetPath);
    }
  });

  return assetPathByKey;
}

function collectPatchTargets() {
  const sourceFile = readSourceFile(areaDefinitionsPath);
  const env = buildPatchTargetEnv();
  const assetPathByKey = buildAssetPathByKey();
  const patchTargetsByFile = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "AREA_DEFINITIONS" || !declaration.initializer) {
        continue;
      }

      const initializer = unwrapExpression(declaration.initializer);
      if (!ts.isObjectLiteralExpression(initializer)) {
        throw new Error("[validate-tmx-patch-layers] Failed to resolve AREA_DEFINITIONS");
      }

      initializer.properties.forEach((areaProperty) => {
        if (!ts.isPropertyAssignment(areaProperty)) {
          return;
        }

        const areaName = getPropertyNameText(areaProperty.name) ?? "unknown";
        const areaDefinition = unwrapExpression(areaProperty.initializer);
        if (!ts.isObjectLiteralExpression(areaDefinition)) {
          throw new Error(`[validate-tmx-patch-layers] Invalid area definition for ${areaName}`);
        }

        const mapInitializer = getObjectPropertyInitializer(areaDefinition, "map");
        if (!mapInitializer) {
          return;
        }

        const mapDefinition = unwrapExpression(mapInitializer);
        if (!ts.isObjectLiteralExpression(mapDefinition)) {
          throw new Error(`[validate-tmx-patch-layers] Invalid map definition for ${areaName}`);
        }

        const tmxKeyInitializer = getObjectPropertyInitializer(mapDefinition, "tmxKey");
        if (!tmxKeyInitializer) {
          return;
        }

        const tmxKey = resolveStringExpression(tmxKeyInitializer, env);
        if (!tmxKey) {
          throw new Error(`[validate-tmx-patch-layers] Failed to resolve tmxKey for ${areaName}`);
        }

        const patchLayerNames = REQUIRED_LAYER_GROUP_NAMES.flatMap((propertyName) => {
          const layerInitializer = getObjectPropertyInitializer(mapDefinition, propertyName);
          if (!layerInitializer) {
            return [];
          }

          const resolvedLayerNames = resolveStringArrayExpression(layerInitializer, env);
          if (!resolvedLayerNames) {
            throw new Error(
              `[validate-tmx-patch-layers] Failed to resolve ${propertyName} for ${areaName}`
            );
          }

          return resolvedLayerNames.filter((layerName) => layerName.includes("(patch)"));
        });

        if (patchLayerNames.length === 0) {
          return;
        }

        const assetPath = assetPathByKey.get(tmxKey);
        if (!assetPath) {
          throw new Error(
            `[validate-tmx-patch-layers] Missing ASSET_PATHS mapping for TMX key "${tmxKey}" in ${areaName}`
          );
        }

        const relativeFile = path.posix.join("public", assetPath.replace(/^\//, ""));
        const target = patchTargetsByFile.get(relativeFile) ?? {
          file: relativeFile,
          requiredLayers: new Set()
        };

        patchLayerNames.forEach((layerName) => target.requiredLayers.add(layerName));
        patchTargetsByFile.set(relativeFile, target);
      });
    }
  }

  return [...patchTargetsByFile.values()]
    .map(({ file, requiredLayers }) => ({
      file,
      requiredLayers: [...requiredLayers]
    }))
    .sort((left, right) => left.file.localeCompare(right.file));
}

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

function logValidationError(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    message.startsWith("[validate-tmx-patch-layers]")
      ? message
      : `[validate-tmx-patch-layers] ${message}`
  );
}

let hasError = false;
let patchTargets = [];

try {
  patchTargets = collectPatchTargets();
} catch (error) {
  logValidationError(error);
  hasError = true;
}

if (patchTargets.length === 0) {
  logValidationError("No TMX patch targets were resolved from AREA_DEFINITIONS");
  hasError = true;
}

patchTargets.forEach(({ file, requiredLayers }) => {
  let map;
  try {
    const absolutePath = path.join(projectRoot, file);
    const xml = fs.readFileSync(absolutePath, "utf8");
    map = parseMap(xml, file);
  } catch (error) {
    logValidationError(error);
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
console.log(`- patch targets: ${patchTargets.map(({ file }) => file).join(", ")}`);
