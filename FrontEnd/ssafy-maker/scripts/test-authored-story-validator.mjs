import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const validatorScriptPath = path.join(projectRoot, "scripts/validate-authored-story.mjs");
const fixturesRoot = path.join(projectRoot, "scripts/fixtures/authored-story-validator");

const cases = [
  {
    name: "invalid startNodeId is rejected",
    fixtureDir: path.join(fixturesRoot, "invalid-start-node"),
    expectedMessage: "startNodeId=missing_start"
  },
  {
    name: "broken node transitions are rejected",
    fixtureDir: path.join(fixturesRoot, "invalid-broken-transitions"),
    expectedMessage: "nextNodeId=missing_node"
  },
  {
    name: "scene state dialogue references must resolve to authored dialogues",
    fixtureDir: path.join(fixturesRoot, "invalid-missing-scene-dialogue"),
    expectedMessage: "dialogueId=npc_missing"
  }
];

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function runValidatorWithFixture(fixtureDir) {
  const dialoguesPath = path.join(fixtureDir, "dialogues.json");
  const sceneStatesPath = path.join(fixtureDir, "scene_states.json");

  try {
    execFileSync(process.execPath, [validatorScriptPath, "--dialogues", dialoguesPath, "--scene-states", sceneStatesPath], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return {
      exitCode: 0,
      output: ""
    };
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";

    return {
      exitCode: typeof error.status === "number" ? error.status : 1,
      output: `${stdout}${stderr}`
    };
  }
}

cases.forEach(({ name, fixtureDir, expectedMessage }) => {
  const result = runValidatorWithFixture(fixtureDir);

  assert.notEqual(result.exitCode, 0, `${name}: validator should fail`);
  assert.match(result.output, /\[validate:authored-story\] 검증 실패/u, `${name}: failure banner should be printed`);
  assert.match(result.output, new RegExp(escapeForRegExp(expectedMessage)), `${name}: expected issue missing`);
});

console.log(`[test:authored-story-validator] OK (${cases.length} cases)`);
