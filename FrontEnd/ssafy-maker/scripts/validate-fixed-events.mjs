import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const storySamplePath = path.join(projectRoot, "public/assets/game/data/story/story.sample.json");
const fixedEventDir = path.join(projectRoot, "public/assets/game/data/story/fixedevent");
const fixedEventsSchemaPath = path.join(projectRoot, "scripts/schemas/fixed-events.schema.json");
const authoredDialoguesSchemaPath = path.join(projectRoot, "scripts/schemas/authored-dialogues.schema.json");
const npcEnumPath = path.join(projectRoot, "src/common/enums/npc.ts");
const dialogueTypesPath = path.join(projectRoot, "src/common/types/dialogue.ts");
const jsonDialogueAdapterPath = path.join(projectRoot, "src/features/story/jsonDialogueAdapter.ts");

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

  throw new Error(`Unsupported object property syntax: ${name.getText(sourceFile)}`);
}

function parseExportedStringMap(sourceText, filePath, exportName) {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true;
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) continue;
      const initializer = unwrapExpression(declaration.initializer);
      if (!ts.isObjectLiteralExpression(initializer)) {
        throw new Error(`${exportName} must be an object literal.`);
      }

      const values = new Map();
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) {
          throw new Error(`${exportName} contains unsupported property syntax.`);
        }

        const propertyName = getPropertyNameText(property.name, sourceFile);
        const propertyValue = unwrapExpression(property.initializer);
        if (!ts.isPropertyAccessExpression(propertyValue) && !ts.isStringLiteralLike(propertyValue)) {
          throw new Error(`${exportName}.${propertyName} must resolve to a string literal.`);
        }

        if (ts.isStringLiteralLike(propertyValue)) {
          values.set(propertyName, propertyValue.text);
          continue;
        }

        values.set(propertyName, propertyValue.name.text);
      }

      return values;
    }
  }

  throw new Error(`${exportName} export not found.`);
}

function parseExportedStringArray(sourceText, filePath, exportName) {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true;
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) continue;
      const initializer = unwrapExpression(declaration.initializer);
      if (!ts.isArrayLiteralExpression(initializer)) {
        throw new Error(`${exportName} must be an array literal.`);
      }

      return initializer.elements.map((element, index) => {
        const resolved = unwrapExpression(element);
        if (!ts.isStringLiteralLike(resolved)) {
          throw new Error(`${exportName}[${index}] must be a string literal.`);
        }

        return resolved.text;
      });
    }
  }

  throw new Error(`${exportName} export not found.`);
}

function compareStringSets(label, actualValues, expectedValues, issues) {
  const actual = [...actualValues].sort();
  const expected = [...expectedValues].sort();

  if (actual.length === expected.length && actual.every((value, index) => value === expected[index])) {
    return;
  }

  issues.push(`[schema-sync] ${label} mismatch. actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
}

function formatSchemaErrors(filePath, errors) {
  return (errors ?? []).map((error) => {
    const instancePath = error.instancePath || "/";
    return `[schema:${path.relative(projectRoot, filePath)}] ${instancePath} ${error.message ?? "is invalid"}`;
  });
}

function normalizeFixedEventPayload(rawJson) {
  if (Array.isArray(rawJson)) {
    return { events: rawJson };
  }

  return rawJson;
}

function normalizeAuthoredDialoguePayload(rawJson) {
  return rawJson;
}

async function collectFixedEventJsonPaths() {
  const entries = await readdir(fixedEventDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^fixed_week\d+\.json$/i.test(entry.name))
    .map((entry) => path.join(fixedEventDir, entry.name))
    .sort();
}

async function main() {
  const [
    fixedEventsSchemaRaw,
    authoredDialoguesSchemaRaw,
    npcEnumSource,
    dialogueTypesSource,
    jsonDialogueAdapterSource,
    fixedEventJsonPaths
  ] = await Promise.all([
    readFile(fixedEventsSchemaPath, "utf8"),
    readFile(authoredDialoguesSchemaPath, "utf8"),
    readFile(npcEnumPath, "utf8"),
    readFile(dialogueTypesPath, "utf8"),
    readFile(jsonDialogueAdapterPath, "utf8"),
    collectFixedEventJsonPaths()
  ]);

  const fixedEventsSchema = JSON.parse(fixedEventsSchemaRaw);
  const authoredDialoguesSchema = JSON.parse(authoredDialoguesSchemaRaw);
  const affectionNpcIds = new Set(parseExportedStringMap(npcEnumSource, npcEnumPath, "AFFECTION_NPC_IDS").keys());
  const dialogueRequirementStatKeys = new Set(
    parseExportedStringArray(dialogueTypesSource, dialogueTypesPath, "DIALOGUE_REQUIREMENT_STAT_KEYS")
  );
  const fixedEventStatChangeKeys = new Set(
    parseExportedStringArray(jsonDialogueAdapterSource, jsonDialogueAdapterPath, "FIXED_EVENT_STAT_CHANGE_KEYS")
  );
  const fixedEventConditionGenderValues = new Set(
    parseExportedStringArray(jsonDialogueAdapterSource, jsonDialogueAdapterPath, "FIXED_EVENT_CONDITION_GENDER_VALUES")
  );

  const issues = [];

  compareStringSets(
    "fixed-events.dialogueRequirement.stat",
    new Set(fixedEventsSchema?.$defs?.dialogueRequirement?.properties?.stat?.enum ?? []),
    dialogueRequirementStatKeys,
    issues
  );
  compareStringSets(
    "fixed-events.affectionRequirement.npcId",
    new Set(fixedEventsSchema?.$defs?.affectionRequirement?.properties?.npcId?.enum ?? []),
    affectionNpcIds,
    issues
  );
  compareStringSets(
    "fixed-events.choiceResult.affectionChanges keys",
    new Set(fixedEventsSchema?.$defs?.choiceResult?.properties?.affectionChanges?.propertyNames?.enum ?? []),
    affectionNpcIds,
    issues
  );
  compareStringSets(
    "fixed-events.choiceResult.statChanges keys",
    new Set(fixedEventsSchema?.$defs?.choiceResult?.properties?.statChanges?.propertyNames?.enum ?? []),
    fixedEventStatChangeKeys,
    issues
  );
  compareStringSets(
    "fixed-events.choiceCondition.playerGender values",
    new Set(fixedEventsSchema?.$defs?.choiceCondition?.properties?.playerGender?.enum ?? []),
    fixedEventConditionGenderValues,
    issues
  );
  compareStringSets(
    "authored-dialogues.affectionRequirement.npcId",
    new Set(authoredDialoguesSchema?.$defs?.affectionRequirement?.properties?.npcId?.enum ?? []),
    affectionNpcIds,
    issues
  );

  const ajv = new Ajv2020({
    allErrors: true,
    strict: false
  });
  const validateFixedEvents = ajv.compile(fixedEventsSchema);
  const filesToValidate = [storySamplePath, ...fixedEventJsonPaths];

  for (const filePath of filesToValidate) {
    const rawJson = JSON.parse(await readFile(filePath, "utf8"));
    const payload = normalizeFixedEventPayload(rawJson);
    const validator = validateFixedEvents;

    if (!validator(payload)) {
      issues.push(...formatSchemaErrors(filePath, validator.errors));
    }
  }

  if (issues.length > 0) {
    console.error("[validate:fixed-events] failed");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:fixed-events] OK");
  console.log(`- files: ${filesToValidate.length}`);
}

main().catch((error) => {
  console.error("[validate:fixed-events] execution failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
