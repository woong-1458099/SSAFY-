import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ssafy-maker-main-scene-runtime-"));

process.on("exit", () => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function transpileModuleToTemp(sourcePath, outputName) {
  const transpiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020
    },
    fileName: sourcePath
  });

  return path.join(tempDir, outputName);
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

class FakeTimerEvent {
  constructor(callback) {
    this.callback = callback;
    this.removed = false;
  }

  remove() {
    this.removed = true;
  }

  fire() {
    if (!this.removed) {
      this.callback();
    }
  }
}

class FakeEmitter {
  constructor() {
    this.handlers = new Map();
  }

  on(eventName, handler) {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  off(eventName, handler) {
    const handlers = this.handlers.get(eventName) ?? [];
    this.handlers.set(
      eventName,
      handlers.filter((candidate) => candidate !== handler)
    );
  }

  emit(eventName) {
    for (const handler of this.handlers.get(eventName) ?? []) {
      handler();
    }
  }
}

class FakeScene {
  constructor() {
    this.events = new FakeEmitter();
    this.timers = [];
    this.time = {
      delayedCall: (_delay, callback) => {
        const timer = new FakeTimerEvent(callback);
        this.timers.push(timer);
        return timer;
      }
    };
    this.sys = {
      isDestroyed: () => false
    };
  }
}

const phaserStubPath = path.join(tempDir, "phaser-stub.mjs");
const renderDepthStubPath = path.join(tempDir, "renderDepth-stub.mjs");
const playerVisualStubPath = path.join(tempDir, "playerVisual-stub.mjs");
const appearanceStubPath = path.join(tempDir, "playerAppearanceDefinitions-stub.mjs");

writeFile(
  phaserStubPath,
  [
    "class Vector2 {",
    "  constructor(x = 0, y = 0) { this.x = x; this.y = y; }",
    "  lengthSq() { return this.x * this.x + this.y * this.y; }",
    "  normalize() { return this; }",
    "  scale() { return this; }",
    "}",
    "export default {",
    "  Scenes: { Events: { SHUTDOWN: 'shutdown', DESTROY: 'destroy' } },",
    "  Math: { Vector2, Clamp: (value, min, max) => Math.min(max, Math.max(min, value)) },",
    "  Input: { Keyboard: { KeyCodes: { W: 87, A: 65, S: 83, D: 68 } } }",
    "};"
  ].join("\n")
);
writeFile(renderDepthStubPath, "export function getActorDepth() { return 0; }\n");
writeFile(
  playerVisualStubPath,
  [
    "export function createPlayerVisual() {",
    "  return {",
    "    root: { active: true, x: 0, y: 0, setPosition() {}, setDepth() {}, destroy() {} },",
    "    base: { active: true },",
    "    clothes: { active: true },",
    "    hair: { active: true }",
    "  };",
    "}",
    "export function updatePlayerVisualFrame() {}"
  ].join("\n")
);
writeFile(
  appearanceStubPath,
  "export function getDefaultPlayerAppearanceDefinition() { return {}; }\n"
);

const playerManagerSourcePath = path.join(projectRoot, "src", "game", "managers", "PlayerManager.ts");
const playerManagerOutputPath = transpileModuleToTemp(playerManagerSourcePath, "PlayerManager.mjs");
let playerManagerOutput = ts.transpileModule(fs.readFileSync(playerManagerSourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020
  },
  fileName: playerManagerSourcePath
}).outputText;
playerManagerOutput = playerManagerOutput
  .replace(/from "phaser"/g, 'from "./phaser-stub.mjs"')
  .replace(/from "\.\.\/systems\/renderDepth"/g, 'from "./renderDepth-stub.mjs"')
  .replace(/from "\.\.\/systems\/playerVisual"/g, 'from "./playerVisual-stub.mjs"')
  .replace(
    /from "\.\.\/definitions\/player\/playerAppearanceDefinitions"/g,
    'from "./playerAppearanceDefinitions-stub.mjs"'
  );
writeFile(playerManagerOutputPath, playerManagerOutput);

const coordinatorSourcePath = path.join(
  projectRoot,
  "src",
  "game",
  "scenes",
  "main",
  "areaRefreshCoordinator.ts"
);
const coordinatorOutputPath = transpileModuleToTemp(coordinatorSourcePath, "areaRefreshCoordinator.mjs");
let coordinatorOutput = ts.transpileModule(fs.readFileSync(coordinatorSourcePath, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020
  },
  fileName: coordinatorSourcePath
}).outputText;
coordinatorOutput = coordinatorOutput.replace(/from "phaser"/g, 'from "./phaser-stub.mjs"');
writeFile(coordinatorOutputPath, coordinatorOutput);

const { resolvePlayerMovementActivityState } = await import(
  `${pathToFileURL(playerManagerOutputPath).href}?t=${Date.now()}`
);
const { MainSceneAreaRefreshCoordinator, shouldAbortAreaRefreshRequest } = await import(
  `${pathToFileURL(coordinatorOutputPath).href}?t=${Date.now()}`
);

const movementCases = [
  {
    name: "collision-blocked directional input still counts as activity",
    input: { didMove: false, hasMoveInput: true, isInputLocked: false },
    expected: { isMoving: false, isMoveInputActive: true }
  },
  {
    name: "input-locked frames do not count as movement activity",
    input: { didMove: false, hasMoveInput: true, isInputLocked: true },
    expected: { isMoving: false, isMoveInputActive: false }
  },
  {
    name: "idle frames stay inactive",
    input: { didMove: false, hasMoveInput: false, isInputLocked: false },
    expected: { isMoving: false, isMoveInputActive: false }
  }
];

movementCases.forEach(({ name, input, expected }) => {
  assert.deepEqual(resolvePlayerMovementActivityState(input), expected, name);
});

assert.equal(
  shouldAbortAreaRefreshRequest({
    signal: new AbortController().signal,
    isCurrentRequest: () => true
  }),
  false,
  "active request should not abort"
);

const abortedController = new AbortController();
abortedController.abort();
assert.equal(
  shouldAbortAreaRefreshRequest({
    signal: abortedController.signal,
    isCurrentRequest: () => true
  }),
  true,
  "aborted request should stop"
);

assert.equal(
  shouldAbortAreaRefreshRequest({
    signal: new AbortController().signal,
    isCurrentRequest: () => false
  }),
  true,
  "stale request should stop"
);

const runningScene = new FakeScene();
const refreshResolvers = [];
const refreshCalls = [];
const coordinator = new MainSceneAreaRefreshCoordinator({
  scene: runningScene,
  canRefresh: () => true,
  refresh: (_expectedAreaId, _expectedPlayerSnapshot, request) => {
    refreshCalls.push(request?.requestId ?? -1);
    return new Promise((resolve) => {
      refreshResolvers.push({
        requestId: request?.requestId ?? -1,
        request,
        resolve
      });
    });
  }
});

coordinator.queue("world");
runningScene.timers.shift().fire();
assert.equal(coordinator.isRefreshInProgress(), true, "first refresh should start");

coordinator.queue("home");
assert.equal(coordinator.isRefreshInProgress(), false, "cancelled refresh should release running flag");
runningScene.timers.shift().fire();
assert.equal(coordinator.isRefreshInProgress(), true, "latest refresh should start");

refreshResolvers[0].resolve();
await flushMicrotasks();
assert.equal(
  coordinator.isRefreshInProgress(),
  true,
  "older refresh completion must not clear the latest running state"
);

refreshResolvers[1].resolve();
await flushMicrotasks();
assert.equal(coordinator.isRefreshInProgress(), false, "latest refresh completion should clear running state");
assert.deepEqual(refreshCalls, [2, 4], "coordinator should only execute the latest queued refreshes");

const disposedScene = new FakeScene();
let disposedRefreshCalled = false;
const disposedCoordinator = new MainSceneAreaRefreshCoordinator({
  scene: disposedScene,
  canRefresh: () => true,
  refresh: () => {
    disposedRefreshCalled = true;
  }
});

disposedCoordinator.queue("world");
disposedCoordinator.dispose();
disposedScene.timers.shift().fire();
await flushMicrotasks();
assert.equal(disposedRefreshCalled, false, "disposed scenes must not run deferred refresh callbacks");

console.log(`[test:main-scene-runtime-contracts] OK (${movementCases.length + 5} cases)`);
