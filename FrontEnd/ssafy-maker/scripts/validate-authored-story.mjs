import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const dialoguesPath = path.join(projectRoot, "public/assets/game/data/story/authored/dialogues.json");
const sceneStatesPath = path.join(projectRoot, "public/assets/game/data/story/authored/scene_states.json");
const areaEnumPath = path.join(projectRoot, "src/common/enums/area.ts");
const npcEnumPath = path.join(projectRoot, "src/common/enums/npc.ts");
const dialogueEnumPath = path.join(projectRoot, "src/common/enums/dialogue.ts");
const dialogueTypesPath = path.join(projectRoot, "src/common/types/dialogue.ts");
const sceneStateIdsPath = path.join(projectRoot, "src/game/definitions/sceneStates/sceneStateIds.ts");
const dialoguesSchemaPath = path.join(projectRoot, "scripts/schemas/authored-dialogues.schema.json");
const sceneStatesSchemaPath = path.join(projectRoot, "scripts/schemas/authored-scene-states.schema.json");
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

function unwrapExpression(expression) {
  let current = expression;

  while (
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function getPropertyNameText(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  throw new Error(`지원하지 않는 객체 키 형식입니다: ${name.getText(sourceFile)}`);
}

function parseExportedStringMap(sourceText, filePath, exportName) {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true;
    if (!isExported) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) {
        continue;
      }

      if (!declaration.initializer) {
        throw new Error(`${exportName} 상수 초기값이 없습니다.`);
      }

      const initializer = unwrapExpression(declaration.initializer);
      if (!ts.isObjectLiteralExpression(initializer)) {
        throw new Error(`${exportName} 상수가 객체 리터럴이 아닙니다.`);
      }

      const values = new Map();

      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) {
          throw new Error(`${exportName} 상수에 지원하지 않는 속성 형식이 있습니다.`);
        }

        const propertyName = getPropertyNameText(property.name, sourceFile);
        const propertyValue = unwrapExpression(property.initializer);
        if (!ts.isStringLiteralLike(propertyValue)) {
          throw new Error(`${exportName}.${propertyName} 값이 문자열 리터럴이 아닙니다.`);
        }

        values.set(propertyName, propertyValue.text);
      }

      if (values.size === 0) {
        throw new Error(`${exportName} 상수에 문자열 값이 없습니다.`);
      }

      return values;
    }
  }

  throw new Error(`${exportName} 상수를 찾지 못했습니다.`);
}

function parseExportedStringArray(sourceText, filePath, exportName) {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true;
    if (!isExported) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) {
        continue;
      }

      if (!declaration.initializer) {
        throw new Error(`${exportName} 상수 초기값이 없습니다.`);
      }

      const initializer = unwrapExpression(declaration.initializer);
      if (!ts.isArrayLiteralExpression(initializer)) {
        throw new Error(`${exportName} 상수가 배열 리터럴이 아닙니다.`);
      }

      const values = initializer.elements.map((element, index) => {
        const resolvedElement = unwrapExpression(element);
        if (!ts.isStringLiteralLike(resolvedElement)) {
          throw new Error(`${exportName}[${index}] 값이 문자열 리터럴이 아닙니다.`);
        }

        return resolvedElement.text;
      });

      if (values.length === 0) {
        throw new Error(`${exportName} 상수에 문자열 값이 없습니다.`);
      }

      return values;
    }
  }

  throw new Error(`${exportName} 상수를 찾지 못했습니다.`);
}

function formatSchemaErrors(schemaName, errors) {
  return ensureArray(errors).map((error) => {
    const instancePath = error.instancePath || "/";
    return `[schema:${schemaName}] ${instancePath} ${error.message ?? "유효하지 않습니다."}`.trim();
  });
}

function findReachableNodes(startNodeId, successorsByNode) {
  const reachable = new Set();
  const stack = [startNodeId];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || reachable.has(nodeId)) {
      continue;
    }

    reachable.add(nodeId);
    for (const nextNodeId of successorsByNode.get(nodeId) ?? []) {
      if (!reachable.has(nextNodeId)) {
        stack.push(nextNodeId);
      }
    }
  }

  return reachable;
}

function findProductiveNodes(terminalNodes, predecessorsByNode) {
  const productive = new Set();
  const stack = [...terminalNodes];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || productive.has(nodeId)) {
      continue;
    }

    productive.add(nodeId);
    for (const prevNodeId of predecessorsByNode.get(nodeId) ?? []) {
      if (!productive.has(prevNodeId)) {
        stack.push(prevNodeId);
      }
    }
  }

  return productive;
}

function validateDialogueGraph(dialoguePrefix, startNodeId, nodeKeys, runtimeEdges, terminalNodes, issues) {
  const successorsByNode = new Map();
  const predecessorsByNode = new Map();

  for (const nodeKey of nodeKeys) {
    successorsByNode.set(nodeKey, new Set());
    predecessorsByNode.set(nodeKey, new Set());
  }

  runtimeEdges.forEach((nextNodeIds, nodeKey) => {
    const successors = successorsByNode.get(nodeKey);
    if (!successors) {
      return;
    }

    nextNodeIds.forEach((nextNodeId) => {
      successors.add(nextNodeId);
      predecessorsByNode.get(nextNodeId)?.add(nodeKey);
    });
  });

  const reachable = findReachableNodes(startNodeId, successorsByNode);
  const unreachableNodeIds = [...nodeKeys].filter((nodeKey) => !reachable.has(nodeKey)).sort();
  if (unreachableNodeIds.length > 0) {
    issues.push(`${dialoguePrefix} startNodeId=${startNodeId} 에서 도달할 수 없는 nodes가 있습니다: ${unreachableNodeIds.join(", ")}`);
  }

  const productive = findProductiveNodes(
    [...terminalNodes].filter((nodeId) => reachable.has(nodeId)),
    predecessorsByNode
  );

  if (!productive.has(startNodeId)) {
    issues.push(`${dialoguePrefix} startNodeId=${startNodeId} 에서 종료 가능한 경로가 없습니다.`);
    return;
  }

  const nonProductiveReachableNodeIds = [...reachable].filter((nodeId) => !productive.has(nodeId)).sort();
  if (nonProductiveReachableNodeIds.length > 0) {
    issues.push(
      `${dialoguePrefix} 종료 불가 순환 또는 막힌 분기 nodes가 있습니다: ${nonProductiveReachableNodeIds.join(", ")}`
    );
  }
}

function validateDialogueScript(dialogue, dialogueIndex, allowedActions, issues) {
  const dialogueId = normalizeString(dialogue?.id) || "(empty)";
  const dialoguePrefix = `[dialogues.${dialogueIndex}] id=${dialogueId}`;
  const startNodeId = normalizeString(dialogue?.startNodeId);

  if (!isRecord(dialogue?.nodes)) {
    issues.push(`${dialoguePrefix} nodes가 객체가 아닙니다.`);
    return;
  }

  const nodeEntries = Object.entries(dialogue.nodes);
  const nodeKeys = new Set(nodeEntries.map(([nodeKey]) => nodeKey));

  if (nodeEntries.length === 0) {
    issues.push(`${dialoguePrefix} nodes가 비어 있습니다.`);
  }

  if (!startNodeId) {
    issues.push(`${dialoguePrefix} startNodeId가 비어 있습니다.`);
  } else if (!nodeKeys.has(startNodeId)) {
    issues.push(`${dialoguePrefix} startNodeId=${startNodeId} 가 nodes에 없습니다.`);
  }

  const normalizedNodeIds = new Set();
  const runtimeEdges = new Map();
  const terminalNodes = new Set();

  nodeEntries.forEach(([nodeKey, node]) => {
    if (!isRecord(node)) {
      issues.push(`${dialoguePrefix} nodes.${nodeKey} 가 객체가 아닙니다.`);
      return;
    }

    const nodeId = normalizeString(node.id);
    if (nodeId && nodeId !== nodeKey) {
      issues.push(`${dialoguePrefix} nodes.${nodeKey}.id=${nodeId} 는 nodes 키와 일치해야 합니다.`);
    }

    const normalizedNodeId = nodeId || nodeKey;
    if (normalizedNodeIds.has(normalizedNodeId)) {
      issues.push(`${dialoguePrefix} node id=${normalizedNodeId} 가 중복됩니다.`);
    } else {
      normalizedNodeIds.add(normalizedNodeId);
    }

    if (!normalizeString(node.text)) {
      issues.push(`${dialoguePrefix} nodes.${nodeKey}.text 가 비어 있거나 문자열이 아닙니다.`);
    }

    const action = normalizeString(node.action);
    if (action && !allowedActions.has(action)) {
      issues.push(`${dialoguePrefix} nodes.${nodeKey}.action=${action} 는 지원하지 않는 DialogueAction 입니다.`);
    }

    const runtimeNextNodeIds = new Set();
    const nextNodeId = normalizeString(node.nextNodeId);
    if (nextNodeId && !nodeKeys.has(nextNodeId)) {
      issues.push(`${dialoguePrefix} nodes.${nodeKey}.nextNodeId=${nextNodeId} 가 nodes에 없습니다.`);
    }

    if (node.choices !== undefined && !Array.isArray(node.choices)) {
      issues.push(`${dialoguePrefix} nodes.${nodeKey}.choices 가 배열이 아닙니다.`);
      return;
    }

    const explicitChoiceIds = new Set();
    const choices = ensureArray(node.choices);

    choices.forEach((choice, choiceIndex) => {
      if (!isRecord(choice)) {
        issues.push(`${dialoguePrefix} nodes.${nodeKey}.choices[${choiceIndex}] 가 객체가 아닙니다.`);
        return;
      }

      if (!normalizeString(choice.text)) {
        issues.push(`${dialoguePrefix} nodes.${nodeKey}.choices[${choiceIndex}].text 가 비어 있거나 문자열이 아닙니다.`);
      }

      const choiceId = normalizeString(choice.id);
      if (choiceId) {
        if (explicitChoiceIds.has(choiceId)) {
          issues.push(`${dialoguePrefix} nodes.${nodeKey} choice id=${choiceId} 가 중복됩니다.`);
        } else {
          explicitChoiceIds.add(choiceId);
        }
      }

      const choiceNextNodeId = normalizeString(choice.nextNodeId);
      if (choiceNextNodeId && !nodeKeys.has(choiceNextNodeId)) {
        issues.push(`${dialoguePrefix} nodes.${nodeKey}.choices[${choiceIndex}].nextNodeId=${choiceNextNodeId} 가 nodes에 없습니다.`);
      } else if (choiceNextNodeId) {
        runtimeNextNodeIds.add(choiceNextNodeId);
      }

      const choiceAction = normalizeString(choice.action);
      if (choiceAction && !allowedActions.has(choiceAction)) {
        issues.push(`${dialoguePrefix} nodes.${nodeKey}.choices[${choiceIndex}].action=${choiceAction} 는 지원하지 않는 DialogueAction 입니다.`);
      }
    });

    if (choices.length > 0) {
      if (choices.some((choice) => !normalizeString(choice?.nextNodeId))) {
        terminalNodes.add(nodeKey);
      }
    } else if (!nextNodeId) {
      terminalNodes.add(nodeKey);
    } else if (nodeKeys.has(nextNodeId)) {
      runtimeNextNodeIds.add(nextNodeId);
    }

    runtimeEdges.set(nodeKey, runtimeNextNodeIds);
  });

  if (startNodeId && nodeKeys.has(startNodeId)) {
    validateDialogueGraph(dialoguePrefix, startNodeId, nodeKeys, runtimeEdges, terminalNodes, issues);
  }
}

function collectDialogueIds(dialoguesJson, requiredDialogueIds, allowedActions, issues) {
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
    validateDialogueScript(dialogue, dialogueIndex, allowedActions, issues);
  });

  for (const requiredDialogueId of requiredDialogueIds) {
    if (!dialogueIds.has(requiredDialogueId)) {
      issues.push(`[dialogues] dialogue enum id=${requiredDialogueId} 가 dialogues.json에 없습니다.`);
    }
  }

  return dialogueIds;
}

function validateSceneStates(sceneStatesJson, npcIds, dialogueIds, requiredSceneStateIds, requiredAreaIds, issues) {
  const seenSceneStateIds = new Set();
  const missingDialogueIds = new Set();

  for (const [sceneStateIndex, sceneState] of ensureArray(sceneStatesJson?.sceneStates).entries()) {
    const sceneStateId = normalizeString(sceneState?.id) || "(unknown_scene_state)";

    if (normalizeString(sceneState?.id)) {
      if (seenSceneStateIds.has(sceneState.id)) {
        issues.push(`[sceneStates] 중복 sceneState id=${sceneState.id} 가 있습니다.`);
      } else {
        seenSceneStateIds.add(sceneState.id);
      }
    } else {
      issues.push(`[sceneStates.${sceneStateIndex}] id가 비어 있습니다.`);
    }

    const areaId = normalizeString(sceneState?.area);
    if (!requiredAreaIds.has(areaId)) {
      issues.push(`[${sceneStateId}] area=${JSON.stringify(sceneState?.area)} 가 AREA_IDS 정의에 없습니다.`);
    }

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
        missingDialogueIds.add(dialogueId);
      }
    }
  }

  if (missingDialogueIds.size > 0) {
    issues.push(`[sceneStates] dialogues.json에 없는 dialogueId 목록: ${[...missingDialogueIds].sort().join(", ")}`);
  }

  for (const requiredSceneStateId of requiredSceneStateIds) {
    if (!seenSceneStateIds.has(requiredSceneStateId)) {
      issues.push(`[sceneStates] 필수 sceneState id=${requiredSceneStateId} 가 scene_states.json에 없습니다.`);
    }
  }
}

async function main() {
  const [
    dialoguesRaw,
    sceneStatesRaw,
    areaEnumSource,
    npcEnumSource,
    dialogueEnumSource,
    dialogueTypesSource,
    sceneStateIdsSource,
    dialoguesSchemaRaw,
    sceneStatesSchemaRaw
  ] = await Promise.all([
    readFile(dialoguesPath, "utf8"),
    readFile(sceneStatesPath, "utf8"),
    readFile(areaEnumPath, "utf8"),
    readFile(npcEnumPath, "utf8"),
    readFile(dialogueEnumPath, "utf8"),
    readFile(dialogueTypesPath, "utf8"),
    readFile(sceneStateIdsPath, "utf8"),
    readFile(dialoguesSchemaPath, "utf8"),
    readFile(sceneStatesSchemaPath, "utf8")
  ]);

  const dialoguesJson = JSON.parse(dialoguesRaw);
  const sceneStatesJson = JSON.parse(sceneStatesRaw);
  const dialoguesSchema = JSON.parse(dialoguesSchemaRaw);
  const sceneStatesSchema = JSON.parse(sceneStatesSchemaRaw);

  const requiredAreaIds = new Set(parseExportedStringMap(areaEnumSource, areaEnumPath, "AREA_IDS").values());
  const npcIds = new Set(parseExportedStringMap(npcEnumSource, npcEnumPath, "NPC_IDS").values());
  const requiredDialogueIds = new Set(parseExportedStringMap(dialogueEnumSource, dialogueEnumPath, "DIALOGUE_IDS").values());
  const allowedActions = new Set(parseExportedStringArray(dialogueTypesSource, dialogueTypesPath, "DIALOGUE_ACTIONS"));
  const requiredSceneStateIds = new Set(parseExportedStringMap(sceneStateIdsSource, sceneStateIdsPath, "SCENE_STATE_IDS").values());
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });

  const dialogueSchemaValidator = ajv.compile(dialoguesSchema);
  const sceneStatesSchemaValidator = ajv.compile(sceneStatesSchema);
  const issues = [];

  if (!dialogueSchemaValidator(dialoguesJson)) {
    issues.push(...formatSchemaErrors("dialogues", dialogueSchemaValidator.errors));
  }

  if (!sceneStatesSchemaValidator(sceneStatesJson)) {
    issues.push(...formatSchemaErrors("sceneStates", sceneStatesSchemaValidator.errors));
  }

  const dialogueIds = collectDialogueIds(dialoguesJson, requiredDialogueIds, allowedActions, issues);
  validateSceneStates(sceneStatesJson, npcIds, dialogueIds, requiredSceneStateIds, requiredAreaIds, issues);

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
