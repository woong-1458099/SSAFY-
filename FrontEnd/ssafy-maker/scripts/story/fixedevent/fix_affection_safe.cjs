const fs = require("fs");
const path = require("path");

const DEFAULT_FIXED_EVENT_DIR = path.resolve(__dirname, "..", "..", "..", "public", "assets", "game", "data", "story", "fixedevent");
function resolveTargetDirectory(inputPath, fallbackPath) {
  const resolvedPath = inputPath
    ? path.resolve(process.cwd(), inputPath)
    : fallbackPath;

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    throw new Error(`Directory not found: ${resolvedPath}`);
  }

  return resolvedPath;
}

function traverse(obj) {
  let changed = false;

  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (traverse(item)) changed = true;
    }
    return changed;
  }

  if (obj.statChanges) {
    const newAffection = obj.affectionChanges || {};
    const migratedKeys = [];

    for (const key of Object.keys(obj.statChanges)) {
      if (!key.startsWith("favor_")) {
        continue;
      }

      const val = obj.statChanges[key];
      let npcId = key.replace("favor_", "");

      if (npcId === "hyo") npcId = "hyoryeon";
      else if (npcId === "pro") npcId = "sunmi";

      const existingValue = typeof newAffection[npcId] === "number" ? newAffection[npcId] : 0;
      newAffection[npcId] = existingValue + val;
      migratedKeys.push(key);
    }

    if (migratedKeys.length > 0) {
      obj.affectionChanges = newAffection;
      for (const key of migratedKeys) {
        delete obj.statChanges[key];
      }

      if (Object.keys(obj.statChanges).length === 0) {
        delete obj.statChanges;
      }
      changed = true;
    }
  }

  for (const key of Object.keys(obj)) {
    if (traverse(obj[key])) {
      changed = true;
    }
  }

  return changed;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const fullPath = path.join(dirPath, file);
    const content = fs.readFileSync(fullPath, "utf8");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      continue;
    }

    if (traverse(parsed)) {
      console.log(`Updated ${fullPath}`);
      fs.writeFileSync(fullPath, JSON.stringify(parsed, null, 2), "utf8");
    }
  }
}

const fixedEventDir = resolveTargetDirectory(process.argv[2], DEFAULT_FIXED_EVENT_DIR);
const romanceDirArg = process.argv[3];

processDirectory(fixedEventDir);
if (romanceDirArg) {
  processDirectory(resolveTargetDirectory(romanceDirArg, DEFAULT_FIXED_EVENT_DIR));
}
