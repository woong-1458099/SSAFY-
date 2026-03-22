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

function parseNpcIds(source) {
  const objectLiteral = extractExportedObjectLiteral(source, "NPC_IDS");
  const parsed = Function(`"use strict"; return (${objectLiteral});`)();
  if (!parsed || typeof parsed !== "object") {
    throw new Error("NPC_IDS 상수를 npc.ts에서 찾지 못했습니다.");
  }

  return new Set(Object.values(parsed).filter((value) => typeof value === "string"));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
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
  const dialogueIds = new Set();

  for (const dialogue of ensureArray(dialoguesJson.dialogues)) {
    const id = typeof dialogue?.id === "string" ? dialogue.id.trim() : "";
    if (!id) {
      issues.push("[dialogues] id가 비어 있는 항목이 있습니다.");
      continue;
    }

    if (dialogueIds.has(id)) {
      issues.push(`[dialogues] 중복 dialogue id=${id} 가 있습니다.`);
      continue;
    }

    dialogueIds.add(id);
  }

  for (const sceneState of ensureArray(sceneStatesJson.sceneStates)) {
    const sceneStateId = typeof sceneState?.id === "string" ? sceneState.id : "(unknown_scene_state)";
    for (const [index, npc] of ensureArray(sceneState?.npcs).entries()) {
      const npcId = typeof npc?.npcId === "string" ? npc.npcId.trim() : "";
      const dialogueId = typeof npc?.dialogueId === "string" ? npc.dialogueId.trim() : "";

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

  if (issues.length > 0) {
    console.error("[validate:authored-story] 검증 실패");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:authored-story] OK");
  console.log(`- dialogues: ${dialogueIds.size}`);
  console.log(`- npc ids: ${npcIds.size}`);
  console.log(`- scene states: ${ensureArray(sceneStatesJson.sceneStates).length}`);
}

main().catch((error) => {
  console.error("[validate:authored-story] 실행 실패");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
