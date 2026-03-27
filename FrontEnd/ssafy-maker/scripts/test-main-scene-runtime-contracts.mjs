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
const tsconfigPath = path.join(projectRoot, "tsconfig.json");
const tsconfigResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const parsedTsconfig = ts.parseJsonConfigFileContent(
  tsconfigResult.config,
  ts.sys,
  projectRoot
);
const transpileCompilerOptions = {
  ...parsedTsconfig.options,
  module: ts.ModuleKind.ESNext,
  noEmit: false
};

let didCleanupTempDir = false;

function cleanupTempDir() {
  if (didCleanupTempDir) {
    return;
  }
  didCleanupTempDir = true;
  fs.rmSync(tempDir, { recursive: true, force: true });
}

process.on("exit", cleanupTempDir);
process.on("SIGINT", () => {
  cleanupTempDir();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanupTempDir();
  process.exit(143);
});

function transpileModuleToTemp(sourcePath, outputName) {
  const transpiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
    compilerOptions: transpileCompilerOptions,
    fileName: sourcePath
  });

  const outputPath = path.join(tempDir, outputName);
  fs.writeFileSync(outputPath, transpiled.outputText, "utf8");
  return outputPath;
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

  count(eventName) {
    return (this.handlers.get(eventName) ?? []).length;
  }
}

class FakeScene {
  constructor() {
    this.events = new FakeEmitter();
    this.timers = [];
    this.time = {
      now: 0,
      delayedCall: (_delay, callback) => {
        const timer = new FakeTimerEvent(callback);
        this.timers.push(timer);
        return timer;
      }
    };
    this.destroyed = false;
    this.sys = {
      isDestroyed: () => this.destroyed
    };
  }

  shutdown() {
    this.events.emit("shutdown");
  }

  destroy() {
    this.destroyed = true;
    this.events.emit("destroy");
  }
}

const phaserStubPath = path.join(tempDir, "phaser-stub.mjs");
const renderDepthStubPath = path.join(tempDir, "renderDepth-stub.mjs");
const playerVisualStubPath = path.join(tempDir, "playerVisual-stub.mjs");
const appearanceStubPath = path.join(tempDir, "playerAppearanceDefinitions-stub.mjs");
const authSessionStubPath = path.join(tempDir, "authSession-stub.mjs");
const sceneKeyStubPath = path.join(tempDir, "sceneKey-stub.mjs");

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
writeFile(
  authSessionStubPath,
  [
    "let state = {",
    "  storedSession: null,",
    "  existingSession: null,",
    "  activeAuthUserId: null,",
    "  logoutShouldReject: false,",
    "  registryApplications: [],",
    "  clearRegistryCalls: 0,",
    "  clearStoredSessionCalls: 0,",
    "  beginLogoutCalls: 0",
    "};",
    "export function __setAuthState(nextState) { state = { ...state, ...nextState }; }",
    "export function __getAuthState() { return state; }",
    "export function applySessionToRegistry(registry, session) {",
    "  state.registryApplications.push(session);",
    "  registry.set('authToken', 'bff-session');",
    "  registry.set('authUser', { id: session.userId });",
    "}",
    "export async function beginLogout() {",
    "  state.beginLogoutCalls += 1;",
    "  if (state.logoutShouldReject) { throw new Error('logout failed'); }",
    "}",
    "export function clearAuthRegistry(registry) {",
    "  state.clearRegistryCalls += 1;",
    "  registry.remove('authToken');",
    "  registry.remove('authUser');",
    "}",
    "export function clearStoredSession() { state.clearStoredSessionCalls += 1; state.storedSession = null; }",
    "export async function fetchExistingSession() { return state.existingSession; }",
    "export function getActiveAuthUserId() { return state.activeAuthUserId; }",
    "export function readStoredSession() { return state.storedSession; }"
  ].join("\n")
);
writeFile(
  sceneKeyStubPath,
  "export const SceneKey = { Login: 'LoginScene' };\n"
);

const playerManagerSourcePath = path.join(projectRoot, "src", "game", "managers", "PlayerManager.ts");
const playerManagerOutputPath = transpileModuleToTemp(playerManagerSourcePath, "PlayerManager.mjs");
let playerManagerOutput = ts.transpileModule(fs.readFileSync(playerManagerSourcePath, "utf8"), {
  compilerOptions: transpileCompilerOptions,
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
  compilerOptions: transpileCompilerOptions,
  fileName: coordinatorSourcePath
}).outputText;
coordinatorOutput = coordinatorOutput.replace(/from "phaser"/g, 'from "./phaser-stub.mjs"');
writeFile(coordinatorOutputPath, coordinatorOutput);

const authFlowSourcePath = path.join(projectRoot, "src", "game", "scenes", "main", "authFlow.ts");
const authFlowOutputPath = transpileModuleToTemp(authFlowSourcePath, "authFlow.mjs");
let authFlowOutput = ts.transpileModule(fs.readFileSync(authFlowSourcePath, "utf8"), {
  compilerOptions: transpileCompilerOptions,
  fileName: authFlowSourcePath
}).outputText;
authFlowOutput = authFlowOutput
  .replace(/from "\.\.\/\.\.\/\.\.\/features\/auth\/authSession"/g, 'from "./authSession-stub.mjs"')
  .replace(/from "\.\.\/\.\.\/\.\.\/shared\/enums\/sceneKey"/g, 'from "./sceneKey-stub.mjs"');
writeFile(authFlowOutputPath, authFlowOutput);

const {
  PlayerManager,
  hasAutoSaveMovementActivity,
  hasImmediatePlayerMovementActivity,
  PLAYER_MOVEMENT_ACTIVITY_GRACE_MS,
  resolvePlayerMovementActivityState,
  shouldRefreshMovementActivityOnInputLock,
  shouldPreservePlayerMovementActivity
} = await import(
  `${pathToFileURL(playerManagerOutputPath).href}?t=${Date.now()}`
);
const { MainSceneAreaRefreshCoordinator, shouldAbortAreaRefreshRequest } = await import(
  `${pathToFileURL(coordinatorOutputPath).href}?t=${Date.now()}`
);
const { ensureMainSceneAuthenticatedEntry, logoutMainSceneSession } = await import(
  `${pathToFileURL(authFlowOutputPath).href}?t=${Date.now()}`
);
const { __getAuthState, __setAuthState } = await import(
  `${pathToFileURL(authSessionStubPath).href}?t=${Date.now()}`
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
  hasImmediatePlayerMovementActivity({ isMoving: false, isMoveInputActive: false }),
  false,
  "autosave-facing activity should stay idle when neither movement nor input is active"
);

const autoSaveActivityReader = PlayerManager.prototype.isAutoSaveMovementActivityInProgress.call({
  isMoving: false,
  hasRawMoveInput: true,
  isInputLocked: false
});
assert.equal(
  autoSaveActivityReader,
  true,
  "autosave callers should read the dedicated PlayerManager autosave activity contract"
);
assert.equal(
  hasAutoSaveMovementActivity({ isMoving: false, hasRawMoveInput: true, isInputLocked: true }),
  false,
  "autosave should stay idle while gameplay input is locked even if raw directional intent is still held"
);
assert.equal(
  hasAutoSaveMovementActivity({ isMoving: false, hasRawMoveInput: true, isInputLocked: false }),
  true,
  "autosave should treat raw directional intent as active again immediately after input unlock"
);
assert.equal(
  hasImmediatePlayerMovementActivity({ isMoving: false, isMoveInputActive: true }),
  true,
  "autosave-facing activity should treat blocked directional input as active play"
);
assert.equal(
  hasImmediatePlayerMovementActivity({ isMoving: false, isMoveInputActive: false }),
  false,
  "autosave-facing activity should stay idle immediately after input lock removes active input"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: false,
    lastActiveAtMs: 1_000,
    nowMs: 1_000 + PLAYER_MOVEMENT_ACTIVITY_GRACE_MS - 1,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  true,
  "dialogue or scene-transition lock frames may preserve grace activity even when immediate autosave activity is already idle"
);
assert.equal(
  hasImmediatePlayerMovementActivity({ isMoving: false, isMoveInputActive: true }),
  true,
  "autosave-facing activity should resume immediately when input returns after unlock"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: true,
    lastActiveAtMs: 1_000,
    nowMs: 1_000 + PLAYER_MOVEMENT_ACTIVITY_GRACE_MS + 1,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  true,
  "unlock frames with recovered directional input should remain active for both immediate and grace-preserved policies"
);

assert.equal(
  shouldRefreshMovementActivityOnInputLock({
    wasInputLocked: false,
    isMoving: true,
    isMoveInputActive: false
  }),
  true,
  "input lock should refresh the activity timestamp when movement was active"
);
assert.equal(
  shouldRefreshMovementActivityOnInputLock({
    wasInputLocked: false,
    isMoving: false,
    isMoveInputActive: true
  }),
  true,
  "input lock should refresh the activity timestamp when blocked input was active"
);
assert.equal(
  shouldRefreshMovementActivityOnInputLock({
    wasInputLocked: true,
    isMoving: true,
    isMoveInputActive: true
  }),
  false,
  "already-locked frames should not keep extending the activity timestamp"
);
assert.equal(
  shouldRefreshMovementActivityOnInputLock({
    wasInputLocked: false,
    isMoving: false,
    isMoveInputActive: false
  }),
  false,
  "idle-to-lock transitions should not refresh the activity timestamp"
);
assert.equal(
  shouldRefreshMovementActivityOnInputLock({
    wasInputLocked: false,
    isMoving: false,
    isMoveInputActive: true
  }),
  true,
  "lock transitions should stamp activity when the player was only holding blocked input"
);

assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: false,
    lastActiveAtMs: 1_000,
    nowMs: 1_100,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  true,
  "last active frame should be preserved briefly across frame-boundary idle states"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: false,
    lastActiveAtMs: 1_000,
    nowMs: 1_400,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  false,
  "movement grace window should expire after the configured delay"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: false,
    lastActiveAtMs: 1_000,
    nowMs: 1_000 + PLAYER_MOVEMENT_ACTIVITY_GRACE_MS - 1,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  true,
  "input-lock transition frame should remain active during the movement grace window"
);
assert.equal(
  hasImmediatePlayerMovementActivity({ isMoving: false, isMoveInputActive: false }),
  false,
  "autosave should still see the same lock-transition frame as idle when only grace-preserved activity remains"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: true,
    lastActiveAtMs: Number.NEGATIVE_INFINITY,
    nowMs: 1_200,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  true,
  "collision-blocked input frame should stay active even without position changes"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: false,
    lastActiveAtMs: 1_000,
    nowMs: 1_000 + PLAYER_MOVEMENT_ACTIVITY_GRACE_MS,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  false,
  "unlock frames after the grace window should become idle again"
);
assert.equal(
  shouldPreservePlayerMovementActivity({
    isMoving: false,
    isMoveInputActive: false,
    lastActiveAtMs: 1_000 + PLAYER_MOVEMENT_ACTIVITY_GRACE_MS,
    nowMs: 1_000 + PLAYER_MOVEMENT_ACTIVITY_GRACE_MS * 2 - 1,
    graceMs: PLAYER_MOVEMENT_ACTIVITY_GRACE_MS
  }),
  true,
  "repeated lock-transition timestamps should extend the grace window from the latest active boundary"
);

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
assert.equal(disposedScene.events.count("shutdown"), 1, "shutdown handler should be registered");
assert.equal(disposedScene.events.count("destroy"), 1, "destroy handler should be registered");
disposedScene.shutdown();
assert.equal(disposedScene.events.count("shutdown"), 0, "shutdown handler should be removed on dispose");
assert.equal(disposedScene.events.count("destroy"), 0, "destroy handler should be removed on dispose");
disposedScene.destroy();
disposedScene.timers.shift().fire();
await flushMicrotasks();
assert.equal(disposedRefreshCalled, false, "disposed scenes must not run deferred refresh callbacks");

function createFakeRegistry(initialState = {}) {
  const store = new Map(Object.entries(initialState));
  return {
    get(key) {
      return store.get(key);
    },
    set(key, value) {
      store.set(key, value);
    },
    remove(key) {
      store.delete(key);
    }
  };
}

function createFakeScenePlugin() {
  return {
    starts: [],
    start(key) {
      this.starts.push(key);
    }
  };
}

__setAuthState({
  storedSession: { userId: "stored-user" },
  existingSession: null,
  activeAuthUserId: null,
  logoutShouldReject: false,
  registryApplications: [],
  clearRegistryCalls: 0,
  clearStoredSessionCalls: 0,
  beginLogoutCalls: 0
});
const storedRegistry = createFakeRegistry();
const storedScenePlugin = createFakeScenePlugin();
assert.equal(
  await ensureMainSceneAuthenticatedEntry(storedRegistry, storedScenePlugin),
  true,
  "stored sessions should allow MainScene entry without redirect"
);
assert.equal(
  storedScenePlugin.starts.length,
  0,
  "stored-session entry should not redirect to login"
);

__setAuthState({
  storedSession: null,
  existingSession: null,
  activeAuthUserId: null,
  logoutShouldReject: false,
  registryApplications: [],
  clearRegistryCalls: 0,
  clearStoredSessionCalls: 0,
  beginLogoutCalls: 0
});
const missingRegistry = createFakeRegistry();
const missingScenePlugin = createFakeScenePlugin();
assert.equal(
  await ensureMainSceneAuthenticatedEntry(missingRegistry, missingScenePlugin),
  false,
  "missing sessions should deny MainScene entry"
);
assert.deepEqual(
  missingScenePlugin.starts,
  ["LoginScene"],
  "missing sessions should redirect to login"
);

__setAuthState({
  storedSession: null,
  existingSession: null,
  activeAuthUserId: null,
  logoutShouldReject: true,
  registryApplications: [],
  clearRegistryCalls: 0,
  clearStoredSessionCalls: 0,
  beginLogoutCalls: 0
});
const logoutRegistry = createFakeRegistry({
  authToken: "bff-session",
  authUser: { id: "user-1" }
});
const logoutScenePlugin = createFakeScenePlugin();
let fallbackCalls = 0;
await logoutMainSceneSession(logoutRegistry, logoutScenePlugin, () => {
  fallbackCalls += 1;
});
assert.equal(fallbackCalls, 1, "logout failure should trigger exactly one local fallback");
assert.deepEqual(
  logoutScenePlugin.starts,
  ["LoginScene"],
  "logout failure should still land on the login scene exactly once"
);
assert.equal(__getAuthState().beginLogoutCalls, 1, "logout flow should attempt remote logout once");

console.log(`[test:main-scene-runtime-contracts] OK (${movementCases.length + 23} cases)`);
