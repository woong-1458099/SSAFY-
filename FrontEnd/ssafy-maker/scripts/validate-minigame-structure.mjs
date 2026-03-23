import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const MINIGAME_ROOTS = [
  path.join(projectRoot, "src/features/minigame"),
  path.join(projectRoot, "src/game/scenes/minigames")
];

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }

    return [fullPath];
  });
}

function toPosixRelative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function extractMinigameSlug(filePath) {
  const normalized = toPosixRelative(filePath);
  const match = normalized.match(/\/(minigame-[a-z0-9-]+)\//iu);
  return match?.[1] ?? null;
}

function collectDuplicateValues(values) {
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
  const files = MINIGAME_ROOTS.flatMap((root) => walkFiles(root));
  const issues = [];

  const typedEntries = files
    .filter((filePath) => path.basename(filePath) === "types.ts")
    .map((filePath) => ({
      filePath,
      relativePath: toPosixRelative(filePath),
      slug: extractMinigameSlug(filePath)
    }));

  const duplicateTypePathsBySlug = new Map();
  typedEntries.forEach((entry) => {
    if (!entry.slug) {
      return;
    }

    const bucket = duplicateTypePathsBySlug.get(entry.slug) ?? [];
    bucket.push(entry.relativePath);
    duplicateTypePathsBySlug.set(entry.slug, bucket);
  });

  [...duplicateTypePathsBySlug.entries()]
    .filter(([, paths]) => paths.length > 1)
    .forEach(([slug, paths]) => {
      issues.push(`[minigame-structure] duplicate types.ts sources for ${slug}: ${paths.join(", ")}`);
    });

  const duplicateMinigameDirs = collectDuplicateValues(
    files
      .map((filePath) => extractMinigameSlug(filePath))
      .filter((value) => value !== null)
  );

  duplicateMinigameDirs.forEach((slug) => {
    const matchingPaths = files
      .filter((filePath) => extractMinigameSlug(filePath) === slug)
      .map((filePath) => toPosixRelative(filePath));

    const hasFeatureRoot = matchingPaths.some((relativePath) => relativePath.startsWith("src/features/minigame/"));
    const hasSceneRoot = matchingPaths.some((relativePath) => relativePath.startsWith("src/game/scenes/minigames/"));
    if (hasFeatureRoot && hasSceneRoot) {
      issues.push(`[minigame-structure] duplicated minigame folder slug across feature/scene roots: ${slug}`);
    }
  });

  if (issues.length > 0) {
    console.error("[validate:minigame-structure] failed");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:minigame-structure] OK");
  console.log(`- scanned files: ${files.length}`);
  console.log(`- types.ts files: ${typedEntries.length}`);
}

main();
