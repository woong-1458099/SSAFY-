import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const registryPath = path.join(projectRoot, "src/app/registry/sceneRegistry.ts");
const sceneEnumPath = path.join(projectRoot, "src/common/enums/scene.ts");
const minigameKeysPath = path.join(projectRoot, "src/features/minigame/minigameSceneKeys.ts");
const minigameCatalogPath = path.join(projectRoot, "src/features/minigame/minigameCatalog.ts");

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function unquote(value) {
  return value.slice(1, -1);
}

function parseSimpleStringConstants(content) {
  const constants = new Map();
  const regex = /export const (\w+) = (["'][^"']+["'])/g;

  for (const match of content.matchAll(regex)) {
    constants.set(match[1], unquote(match[2]));
  }

  return constants;
}

function parseObjectStringConstants(content, objectName) {
  const objectMatch = content.match(new RegExp(`export const ${objectName} = \\{([\\s\\S]*?)\\} as const;`));
  if (!objectMatch) {
    throw new Error(`[validate:scene-registry] ${objectName} object constant could not be parsed.`);
  }

  const entries = new Map();
  for (const rawLine of objectMatch[1].split(/\r?\n/u)) {
    const line = rawLine.replace(/\/\/.*$/u, "").trim();
    if (!line) {
      continue;
    }

    const entryMatch = line.match(/^(\w+):\s*(["'][^"']+["'])/u);
    if (entryMatch) {
      entries.set(entryMatch[1], unquote(entryMatch[2]));
    }
  }

  return entries;
}

function parseArrayBody(content, arrayName) {
  const match = content.match(new RegExp(`export const ${arrayName} = \\[([\\s\\S]*?)\\] as const;`));
  if (!match) {
    throw new Error(`[validate:scene-registry] ${arrayName} array constant could not be parsed.`);
  }

  return match[1]
    .split(/\r?\n/u)
    .map((line) => line.replace(/\/\/.*$/u, "").trim())
    .filter(Boolean)
    .map((line) => line.replace(/,$/u, ""));
}

function resolveExpression(expression, simpleConstants, objectConstants) {
  const trimmed = expression.trim();
  if (/^["'][^"']+["']$/u.test(trimmed)) {
    return unquote(trimmed);
  }

  if (simpleConstants.has(trimmed)) {
    return simpleConstants.get(trimmed);
  }

  const memberMatch = trimmed.match(/^(\w+)\.(\w+)$/u);
  if (memberMatch) {
    const [, objectName, propertyName] = memberMatch;
    const objectMap = objectConstants.get(objectName);
    if (objectMap?.has(propertyName)) {
      return objectMap.get(propertyName);
    }
  }

  throw new Error(`[validate:scene-registry] Unsupported expression: ${trimmed}`);
}

function resolveArrayConstant(arrayName, content, simpleConstants, objectConstants, cache = new Map()) {
  if (cache.has(arrayName)) {
    return cache.get(arrayName);
  }

  const values = [];
  const tokens = parseArrayBody(content, arrayName);
  for (const token of tokens) {
    if (token.startsWith("...")) {
      values.push(...resolveArrayConstant(token.slice(3), content, simpleConstants, objectConstants, cache));
      continue;
    }

    values.push(resolveExpression(token, simpleConstants, objectConstants));
  }

  cache.set(arrayName, values);
  return values;
}

function parseImportMap(content, baseFilePath) {
  const importMap = new Map();
  const importRegex = /import\s+(?:\{\s*([^}]+)\s*\}|([A-Za-z0-9_]+))\s+from\s+"([^"]+)";/gms;

  for (const match of content.matchAll(importRegex)) {
    const namedImports = match[1];
    const defaultImport = match[2];
    const sourcePath = match[3];
    if (!sourcePath.includes("../../game/scenes")) {
      continue;
    }

    const resolvedPath = path.resolve(path.dirname(baseFilePath), `${sourcePath}.ts`);
    if (defaultImport) {
      importMap.set(defaultImport.trim(), resolvedPath);
      continue;
    }

    namedImports
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        const [importName, localName] = token.split(/\s+as\s+/u).map((part) => part.trim());
        importMap.set(localName ?? importName, resolvedPath);
      });
  }

  return importMap;
}

function parseRegistryEntries(content, simpleConstants, objectConstants) {
  const arrayMatch = content.match(/const SCENE_REGISTRY_ENTRIES: readonly SceneRegistryEntry\[] = \[([\s\S]*?)\];/);
  if (!arrayMatch) {
    throw new Error("[validate:scene-registry] SCENE_REGISTRY_ENTRIES array could not be parsed.");
  }

  const entries = [];
  const entryRegex = /\{\s*key:\s*([^,]+),\s*scene:\s*([A-Za-z0-9_]+)\s*\}/g;

  for (const match of arrayMatch[1].matchAll(entryRegex)) {
    entries.push({
      key: resolveExpression(match[1], simpleConstants, objectConstants),
      sceneName: match[2]
    });
  }

  return entries;
}

function parseDeclaredSceneKey(filePath, simpleConstants, objectConstants) {
  const content = readFile(filePath);
  const keyObjectMatch = content.match(/super\(\s*\{\s*key:\s*([^}]+)\}\s*\)/m);
  const plainMatch = content.match(/super\(\s*([^)]+)\s*\)/m);
  const expression = (keyObjectMatch?.[1] ?? plainMatch?.[1] ?? "").trim();
  if (!expression) {
    throw new Error(`[validate:scene-registry] Scene super() key could not be parsed: ${path.relative(projectRoot, filePath)}`);
  }

  return resolveExpression(expression, simpleConstants, objectConstants);
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates].sort();
}

function main() {
  const sceneEnumContent = readFile(sceneEnumPath);
  const minigameKeysContent = readFile(minigameKeysPath);
  const registryContent = readFile(registryPath);
  const minigameCatalogContent = readFile(minigameCatalogPath);

  const simpleConstants = new Map([
    ...parseSimpleStringConstants(sceneEnumContent),
    ...parseSimpleStringConstants(minigameKeysContent)
  ]);
  const objectConstants = new Map([["SCENE_KEYS", parseObjectStringConstants(sceneEnumContent, "SCENE_KEYS")]]);
  const coreSceneKeys = [...objectConstants.get("SCENE_KEYS").values()];
  const importMap = parseImportMap(registryContent, registryPath);
  const registryEntries = parseRegistryEntries(registryContent, simpleConstants, objectConstants);
  const issues = [];

  const registryKeyDuplicates = findDuplicates(registryEntries.map((entry) => entry.key));
  if (registryKeyDuplicates.length > 0) {
    issues.push(`[sceneRegistry] duplicate registry keys: ${registryKeyDuplicates.join(", ")}`);
  }

  const declaredSceneKeys = registryEntries.map((entry) => {
    const sceneFilePath = importMap.get(entry.sceneName);
    if (!sceneFilePath) {
      throw new Error(`[validate:scene-registry] Missing import path for ${entry.sceneName}`);
    }

    return {
      ...entry,
      declaredKey: parseDeclaredSceneKey(sceneFilePath, simpleConstants, objectConstants)
    };
  });

  const declaredKeyDuplicates = findDuplicates(declaredSceneKeys.map((entry) => entry.declaredKey));
  if (declaredKeyDuplicates.length > 0) {
    issues.push(`[sceneRegistry] duplicate declared scene keys: ${declaredKeyDuplicates.join(", ")}`);
  }

  const mismatches = declaredSceneKeys
    .filter((entry) => entry.key !== entry.declaredKey)
    .map((entry) => `${entry.sceneName}: registry=${entry.key}, declared=${entry.declaredKey}`);
  if (mismatches.length > 0) {
    issues.push(`[sceneRegistry] registry/declaration mismatches: ${mismatches.join(" | ")}`);
  }

  const legacyMinigameSceneKeys = resolveArrayConstant(
    "LEGACY_MINIGAME_SCENE_KEYS",
    minigameKeysContent,
    simpleConstants,
    objectConstants
  );
  const supportedMinigameSceneKeys = resolveArrayConstant(
    "SUPPORTED_MINIGAME_SCENE_KEYS",
    minigameKeysContent,
    simpleConstants,
    objectConstants
  );
  const deprecatedMinigameSceneKeys = resolveArrayConstant(
    "DEPRECATED_MINIGAME_SCENE_KEYS",
    minigameKeysContent,
    simpleConstants,
    objectConstants
  );
  const cardKeys = [...minigameCatalogContent.matchAll(/key:\s*(["'][^"']+["'])/g)].map((match) => unquote(match[1]));

  const deprecatedInSupported = supportedMinigameSceneKeys.filter((key) => deprecatedMinigameSceneKeys.includes(key));
  if (deprecatedInSupported.length > 0) {
    issues.push(`[minigameSceneKeys] deprecated keys remain supported: ${deprecatedInSupported.join(", ")}`);
  }

  const registryMinigameKeys = registryEntries
    .map((entry) => entry.key)
    .filter((key) => !coreSceneKeys.includes(key));
  const registryMinigameKeySet = new Set(registryMinigameKeys);

  const missingSupportedRegistryKeys = supportedMinigameSceneKeys.filter((key) => !registryMinigameKeySet.has(key));
  if (missingSupportedRegistryKeys.length > 0) {
    issues.push(`[sceneRegistry] supported minigame keys missing from registry: ${missingSupportedRegistryKeys.join(", ")}`);
  }

  const unexpectedRegistryMinigameKeys = registryMinigameKeys.filter((key) => !supportedMinigameSceneKeys.includes(key));
  if (unexpectedRegistryMinigameKeys.length > 0) {
    issues.push(`[sceneRegistry] unsupported minigame keys registered: ${unexpectedRegistryMinigameKeys.join(", ")}`);
  }

  const missingCatalogKeys = cardKeys.filter((key) => !registryMinigameKeySet.has(key));
  if (missingCatalogKeys.length > 0) {
    issues.push(`[minigameCatalog] card keys missing from registry: ${missingCatalogKeys.join(", ")}`);
  }

  const uncataloguedLegacyKeys = legacyMinigameSceneKeys.filter((key) => !cardKeys.includes(key));
  if (uncataloguedLegacyKeys.length > 0) {
    issues.push(`[minigameCatalog] legacy scene keys missing from cards: ${uncataloguedLegacyKeys.join(", ")}`);
  }

  if (issues.length > 0) {
    console.error("[validate:scene-registry] failed");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:scene-registry] OK");
  console.log(`- registry entries: ${registryEntries.length}`);
  console.log(`- supported minigame keys: ${supportedMinigameSceneKeys.length}`);
  console.log(`- catalog cards: ${cardKeys.length}`);
}

main();
