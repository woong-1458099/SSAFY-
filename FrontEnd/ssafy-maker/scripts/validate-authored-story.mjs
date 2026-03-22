import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const dialoguesPath = path.join(projectRoot, "public/assets/game/data/story/authored/dialogues.json");
const sceneStatesPath = path.join(projectRoot, "public/assets/game/data/story/authored/scene_states.json");
const npcEnumPath = path.join(projectRoot, "src/common/enums/npc.ts");

function parseNpcIds(source) {
  const npcIds = new Set();
  const match = source.match(/export const NPC_IDS = \{([\s\S]*?)\} as const;/);
  if (!match) {
    throw new Error("NPC_IDS 상수를 npc.ts에서 찾지 못했습니다.");
  }

  for (const valueMatch of match[1].matchAll(/:\s*"([^"]+)"/g)) {
    npcIds.add(valueMatch[1]);
  }

  return npcIds;
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
