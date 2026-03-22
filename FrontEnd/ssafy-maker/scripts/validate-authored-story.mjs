import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const dialoguesPath = path.join(projectRoot, "public/assets/game/data/story/authored/dialogues.json");
const sceneStatesPath = path.join(projectRoot, "public/assets/game/data/story/authored/scene_states.json");
const npcEnumPath = path.join(projectRoot, "src/common/enums/npc.ts");
const SCENE_STATE_NPC_DIALOGUE_ID_PATTERN = /^npc_[a-z0-9_]+$/;

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function extractExportedObjectLiteral(source, exportName) {
  const exportIndex = source.indexOf(`export const ${exportName}`);
  if (exportIndex < 0) {
    throw new Error(`${exportName} 상수를 찾지 못했습니다.`);
  }

  const braceStart = source.indexOf("{", exportIndex);
  if (braceStart < 0) {
    throw new Error(`${exportName} 상수의 시작 중괄호를 찾지 못했습니다.`);
  }

  let depth = 0;
  let inString = false;
  let stringQuote = "";

  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const prevChar = source[index - 1];

    if (inString) {
      if (char === stringQuote && prevChar !== "\\") {
        inString = false;
        stringQuote = "";
      }
      continue;
    }

    if (char === "'" || char === "\"" || char === "`") {
      inString = true;
      stringQuote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart, index + 1);
      }
    }
  }

  throw new Error(`${exportName} 상수의 종료 중괄호를 찾지 못했습니다.`);
}

function isWhitespace(char) {
  return char === " " || char === "\n" || char === "\r" || char === "\t";
}

function skipTrivia(source, startIndex) {
  let index = startIndex;

  while (index < source.length) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (isWhitespace(char)) {
      index += 1;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }
      continue;
    }

    if (char === "/" && nextChar === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        index += 1;
      }

      if (index >= source.length) {
        throw new Error("주석이 닫히지 않았습니다.");
      }

      index += 2;
      continue;
    }

    break;
  }

  return index;
}

function parseIdentifier(source, startIndex) {
  const firstChar = source[startIndex];
  if (!/[A-Za-z_$]/.test(firstChar ?? "")) {
    throw new Error(`예상한 식별자가 없습니다. near=${JSON.stringify(source.slice(startIndex, startIndex + 16))}`);
  }

  let index = startIndex + 1;
  while (index < source.length && /[\w$]/.test(source[index])) {
    index += 1;
  }

  return {
    value: source.slice(startIndex, index),
    nextIndex: index
  };
}

function parseStringLiteral(source, startIndex) {
  const quote = source[startIndex];
  if (quote !== "'" && quote !== "\"") {
    throw new Error(`예상한 문자열 리터럴이 없습니다. near=${JSON.stringify(source.slice(startIndex, startIndex + 16))}`);
  }

  let index = startIndex + 1;
  let value = "";

  while (index < source.length) {
    const char = source[index];

    if (char === "\\") {
      const escapeChar = source[index + 1];
      if (escapeChar === undefined) {
        throw new Error("문자열 리터럴의 escape가 비정상적으로 종료되었습니다.");
      }

      switch (escapeChar) {
        case "\\":
        case "\"":
        case "'":
          value += escapeChar;
          break;
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "\t";
          break;
        case "b":
          value += "\b";
          break;
        case "f":
          value += "\f";
          break;
        case "v":
          value += "\v";
          break;
        case "0":
          value += "\0";
          break;
        default:
          value += escapeChar;
          break;
      }

      index += 2;
      continue;
    }

    if (char === quote) {
      return {
        value,
        nextIndex: index + 1
      };
    }

    value += char;
    index += 1;
  }

  throw new Error("문자열 리터럴이 닫히지 않았습니다.");
}

function parseObjectStringMap(source) {
  const entries = new Map();
  let index = skipTrivia(source, 0);

  if (source[index] !== "{") {
    throw new Error("객체 리터럴 시작 중괄호를 찾지 못했습니다.");
  }

  index += 1;

  while (index < source.length) {
    index = skipTrivia(source, index);

    if (source[index] === "}") {
      return entries;
    }

    let keyResult;
    if (source[index] === "'" || source[index] === "\"") {
      keyResult = parseStringLiteral(source, index);
    } else {
      keyResult = parseIdentifier(source, index);
    }

    index = skipTrivia(source, keyResult.nextIndex);
    if (source[index] !== ":") {
      throw new Error(`객체 리터럴에서 ':'를 찾지 못했습니다. key=${keyResult.value}`);
    }

    index = skipTrivia(source, index + 1);
    const valueResult = parseStringLiteral(source, index);
    entries.set(keyResult.value, valueResult.value);
    index = skipTrivia(source, valueResult.nextIndex);

    if (source[index] === ",") {
      index += 1;
      continue;
    }

    if (source[index] === "}") {
      return entries;
    }

    throw new Error(
      `객체 리터럴 항목 종료 문자가 올바르지 않습니다. near=${JSON.stringify(source.slice(index, index + 16))}`
    );
  }

  throw new Error("객체 리터럴이 닫히지 않았습니다.");
}

function parseNpcIds(source) {
  const objectLiteral = extractExportedObjectLiteral(source, "NPC_IDS");
  const parsed = parseObjectStringMap(objectLiteral);

  if (parsed.size === 0) {
    throw new Error("NPC_IDS 상수를 npc.ts에서 찾지 못했습니다.");
  }

  return new Set([...parsed.values()].filter((value) => typeof value === "string" && value.length > 0));
}

function validateDialogueScript(dialogue, dialogueIndex, issues) {
  const dialoguePrefix = `[dialogues.${dialogueIndex}]`;
  const startNodeId = normalizeString(dialogue?.startNodeId);

  if (!isRecord(dialogue?.nodes)) {
    issues.push(`${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes가 객체가 아닙니다.`);
    return;
  }

  const nodeEntries = Object.entries(dialogue.nodes);
  const nodeKeys = new Set(nodeEntries.map(([nodeKey]) => nodeKey));

  if (nodeEntries.length === 0) {
    issues.push(`${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes가 비어 있습니다.`);
  }

  if (!startNodeId) {
    issues.push(`${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} startNodeId가 비어 있습니다.`);
  } else if (!nodeKeys.has(startNodeId)) {
    issues.push(`${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} startNodeId=${startNodeId} 가 nodes에 없습니다.`);
  }

  const normalizedNodeIds = new Set();

  nodeEntries.forEach(([nodeKey, node]) => {
    if (!isRecord(node)) {
      issues.push(`${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes.${nodeKey} 가 객체가 아닙니다.`);
      return;
    }

    const normalizedNodeId = normalizeString(node.id) || nodeKey;
    if (normalizedNodeIds.has(normalizedNodeId)) {
      issues.push(
        `${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} node id=${normalizedNodeId} 가 중복됩니다.`
      );
    } else {
      normalizedNodeIds.add(normalizedNodeId);
    }

    const nextNodeId = normalizeString(node.nextNodeId);
    if (nextNodeId && !nodeKeys.has(nextNodeId)) {
      issues.push(
        `${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes.${nodeKey}.nextNodeId=${nextNodeId} 가 nodes에 없습니다.`
      );
    }

    if (node.choices !== undefined && !Array.isArray(node.choices)) {
      issues.push(`${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes.${nodeKey}.choices 가 배열이 아닙니다.`);
      return;
    }

    const explicitChoiceIds = new Set();

    ensureArray(node.choices).forEach((choice, choiceIndex) => {
      if (!isRecord(choice)) {
        issues.push(
          `${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes.${nodeKey}.choices[${choiceIndex}] 가 객체가 아닙니다.`
        );
        return;
      }

      const choiceId = normalizeString(choice.id);
      if (choiceId) {
        if (explicitChoiceIds.has(choiceId)) {
          issues.push(
            `${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes.${nodeKey} choice id=${choiceId} 가 중복됩니다.`
          );
        } else {
          explicitChoiceIds.add(choiceId);
        }
      }

      const choiceNextNodeId = normalizeString(choice.nextNodeId);
      if (choiceNextNodeId && !nodeKeys.has(choiceNextNodeId)) {
        issues.push(
          `${dialoguePrefix} id=${normalizeString(dialogue?.id) || "(empty)"} nodes.${nodeKey}.choices[${choiceIndex}].nextNodeId=${choiceNextNodeId} 가 nodes에 없습니다.`
        );
      }
    });
  });
}

function collectDialogueIds(dialoguesJson, issues) {
  const dialogueIds = new Set();

  ensureArray(dialoguesJson?.dialogues).forEach((dialogue, dialogueIndex) => {
    const id = normalizeString(dialogue?.id);
    if (!id) {
      issues.push(`[dialogues.${dialogueIndex}] id가 비어 있는 항목이 있습니다.`);
      return;
    }

    if (dialogueIds.has(id)) {
      issues.push(`[dialogues] 중복 dialogue id=${id} 가 있습니다.`);
      return;
    }

    dialogueIds.add(id);
    validateDialogueScript(dialogue, dialogueIndex, issues);
  });

  return dialogueIds;
}

function validateSceneStates(sceneStatesJson, npcIds, dialogueIds, issues) {
  for (const sceneState of ensureArray(sceneStatesJson?.sceneStates)) {
    const sceneStateId = normalizeString(sceneState?.id) || "(unknown_scene_state)";

    for (const [index, npc] of ensureArray(sceneState?.npcs).entries()) {
      const npcId = normalizeString(npc?.npcId);
      const dialogueId = normalizeString(npc?.dialogueId);

      if (!npcIds.has(npcId)) {
        issues.push(`[${sceneStateId}] npcs[${index}] npcId=${JSON.stringify(npc?.npcId)} 가 NPC enum에 없습니다.`);
      }

      if (!dialogueId) {
        issues.push(`[${sceneStateId}] npcs[${index}] npcId=${npcId || "(empty)"} dialogueId가 비어 있습니다.`);
        continue;
      }

      const expectedDialogueId = npcId ? `npc_${npcId}` : "";
      if (!SCENE_STATE_NPC_DIALOGUE_ID_PATTERN.test(dialogueId) || (expectedDialogueId && dialogueId !== expectedDialogueId)) {
        issues.push(
          `[${sceneStateId}] npcs[${index}] npcId=${npcId || "(empty)"} dialogueId=${dialogueId} 는 규칙과 다릅니다. expected=${expectedDialogueId || "npc_<npcId>"}`
        );
      }

      if (!dialogueIds.has(dialogueId)) {
        issues.push(`[${sceneStateId}] npcs[${index}] npcId=${npcId || "(empty)"} dialogueId=${dialogueId} 가 dialogues.json에 없습니다.`);
      }
    }
  }
}

async function main() {
  const [dialoguesRaw, sceneStatesRaw, npcEnumSource] = await Promise.all([
    readFile(dialoguesPath, "utf8"),
    readFile(sceneStatesPath, "utf8"),
    readFile(npcEnumPath, "utf8")
  ]);

  const dialoguesJson = JSON.parse(dialoguesRaw);
  const sceneStatesJson = JSON.parse(sceneStatesRaw);
  const npcIds = parseNpcIds(npcEnumSource);
  const issues = [];
  const dialogueIds = collectDialogueIds(dialoguesJson, issues);

  validateSceneStates(sceneStatesJson, npcIds, dialogueIds, issues);

  if (issues.length > 0) {
    console.error("[validate:authored-story] 검증 실패");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:authored-story] OK");
  console.log(`- dialogues: ${dialogueIds.size}`);
  console.log(`- npc ids: ${npcIds.size}`);
  console.log(`- scene states: ${ensureArray(sceneStatesJson?.sceneStates).length}`);
}

main().catch((error) => {
  console.error("[validate:authored-story] 실행 실패");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
