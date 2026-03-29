import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ssafy-maker-audio-runtime-"));

function cleanupTempDir() {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

process.on("exit", cleanupTempDir);

const tsconfigPath = path.join(projectRoot, "tsconfig.json");
const tsconfigResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const parsedTsconfig = ts.parseJsonConfigFileContent(tsconfigResult.config, ts.sys, projectRoot);
const transpileCompilerOptions = {
  ...parsedTsconfig.options,
  module: ts.ModuleKind.ESNext,
  noEmit: false
};

function transpileModuleToTemp(sourcePath, outputName, replacements = []) {
  let output = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
    compilerOptions: transpileCompilerOptions,
    fileName: sourcePath
  }).outputText;

  replacements.forEach(({ from, to }) => {
    output = output.replace(from, to);
  });

  const outputPath = path.join(tempDir, outputName);
  fs.writeFileSync(outputPath, output, "utf8");
  return outputPath;
}

fs.writeFileSync(
  path.join(tempDir, "phaser-stub.mjs"),
  [
    "class FakeSoundBase {",
    "  constructor(key, manager) { this.key = key; this.manager = manager; this.isPlaying = false; this.destroyed = false; }",
    "  stop() { this.isPlaying = false; }",
    "  play() { this.isPlaying = true; }",
    "  destroy() { this.destroyed = true; this.manager._destroyed.push(this.key); }",
    "  once() {}",
    "}",
    "export default {",
    "  Math: { Clamp: (value, min, max) => Math.min(max, Math.max(min, value)) },",
    "  Sound: { Events: { UNLOCKED: 'unlocked' } },",
    "  Scenes: { Events: { SHUTDOWN: 'shutdown', DESTROY: 'destroy' } }",
    "};",
    "export { FakeSoundBase };"
  ].join("\n"),
  "utf8"
);

const audioManagerPath = transpileModuleToTemp(
  path.join(projectRoot, "src", "core", "managers", "AudioManager.ts"),
  "AudioManager.mjs",
  [{ from: /from "phaser"/g, to: 'from "./phaser-stub.mjs"' }]
);

const minigameAudioPath = transpileModuleToTemp(
  path.join(projectRoot, "src", "game", "scenes", "minigames", "utils", "minigameAudio.ts"),
  "minigameAudio.mjs",
  [
    { from: /from "phaser"/g, to: 'from "./phaser-stub.mjs"' },
    { from: /from "\.\.\/\.\.\/\.\.\/\.\.\/core\/managers\/AudioManager"/g, to: 'from "./AudioManager.mjs"' }
  ]
);

const { default: Phaser, FakeSoundBase } = await import(pathToFileURL(path.join(tempDir, "phaser-stub.mjs")).href);
const { AudioManager } = await import(`${pathToFileURL(audioManagerPath).href}?t=${Date.now()}`);
const { playMinigameBgm, stopMinigameBgm } = await import(`${pathToFileURL(minigameAudioPath).href}?t=${Date.now()}`);

class FakeEmitter {
  constructor() {
    this.handlers = new Map();
  }

  on(eventName, handler) {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push({ handler, once: false });
    this.handlers.set(eventName, handlers);
  }

  once(eventName, handler) {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push({ handler, once: true });
    this.handlers.set(eventName, handlers);
  }

  off(eventName, handler) {
    const handlers = this.handlers.get(eventName) ?? [];
    this.handlers.set(eventName, handlers.filter((entry) => entry.handler !== handler));
  }

  emit(eventName) {
    const handlers = [...(this.handlers.get(eventName) ?? [])];
    handlers.forEach((entry) => {
      entry.handler();
      if (entry.once) {
        this.off(eventName, entry.handler);
      }
    });
  }

  count(eventName) {
    return (this.handlers.get(eventName) ?? []).length;
  }
}

function createSoundManager() {
  const emitter = new FakeEmitter();
  const manager = {
    locked: false,
    _destroyed: [],
    cacheKeys: new Set(["audio-a", "audio-b"]),
    sounds: [],
    add(key) {
      const sound = new FakeSoundBase(key, manager);
      sound.once = () => {};
      manager.sounds.push(sound);
      return sound;
    },
    play() {
      return true;
    },
    once(eventName, handler) {
      emitter.once(eventName, handler);
    },
    off(eventName, handler) {
      emitter.off(eventName, handler);
    },
    emit(eventName) {
      emitter.emit(eventName);
    },
    count(eventName) {
      return emitter.count(eventName);
    }
  };

  return manager;
}

function createScene() {
  const sound = createSoundManager();
  return {
    sound,
    cache: {
      audio: {
        exists: (key) => sound.cacheKeys.has(key)
      }
    },
    events: new FakeEmitter()
  };
}

const audioManager = new AudioManager();
const ownerScene = createScene();
const legacyScene = createScene();
const otherScene = createScene();

const ownerManaged = audioManager.add(ownerScene, "audio-a", "bgm", { loop: true, volume: 0.5 });
const legacyManaged = legacyScene.sound.add("audio-a");
legacyManaged.isPlaying = true;
audioManager.registerManagedSound(legacyManaged, "bgm", 0.5);
const otherManaged = audioManager.add(otherScene, "audio-b", "bgm", { loop: true, volume: 0.5 });
const registerSceneOnlyManaged = otherScene.sound.add("audio-a");
registerSceneOnlyManaged.isPlaying = true;
audioManager.registerSceneManagedSound(otherScene, registerSceneOnlyManaged, "bgm", 0.5);

ownerManaged.isPlaying = true;
otherManaged.isPlaying = true;

audioManager.stopManagedSounds("bgm", { scene: ownerScene });
assert.equal(ownerManaged.isPlaying, false, "ownerScene-managed sounds should stop for the matching scene");
assert.equal(legacyManaged.isPlaying, true, "legacy manager-only sounds from other scenes should remain untouched");
assert.equal(otherManaged.isPlaying, true, "other ownerScene-managed sounds should remain untouched");
assert.equal(registerSceneOnlyManaged.isPlaying, true, "explicit registerScene-managed sounds from other scenes should remain untouched");

audioManager.stopManagedSounds("bgm", { scene: legacyScene });
assert.equal(legacyManaged.isPlaying, false, "legacy manager-only sounds should still stop via manager fallback");

audioManager.stopManagedSounds("bgm", { scene: otherScene });
assert.equal(registerSceneOnlyManaged.isPlaying, false, "registerScene-managed sounds should stop for the matching owner scene");

const lockedScene = createScene();
lockedScene.sound.locked = true;
const lockedBgm = playMinigameBgm(lockedScene, audioManager, "audio-a", { volume: 0.5 });
assert.equal(lockedScene.sound.count(Phaser.Sound.Events.UNLOCKED), 1, "locked playback should register an unlock listener");
assert.equal(lockedScene.events.count(Phaser.Scenes.Events.SHUTDOWN), 1, "locked playback should register scene shutdown cleanup");
lockedScene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
assert.equal(lockedScene.sound.count(Phaser.Sound.Events.UNLOCKED), 0, "shutdown should remove pending unlock listeners");
assert.equal(lockedBgm.isPlaying, false, "cleanup before unlock should leave the bgm stopped");

const relockedScene = createScene();
relockedScene.sound.locked = true;
const relockedBgm = playMinigameBgm(relockedScene, audioManager, "audio-a", { volume: 0.5 });
assert.equal(relockedBgm.isPlaying, false, "locked playback should defer actual play");
relockedScene.sound.emit(Phaser.Sound.Events.UNLOCKED);
assert.equal(relockedBgm.isPlaying, true, "unlock should resume deferred bgm playback");
stopMinigameBgm(relockedScene, audioManager);
assert.equal(relockedScene.sound.count(Phaser.Sound.Events.UNLOCKED), 0, "explicit stop should also clear pending unlock listeners");

console.log("[test:audio-runtime-contracts] OK (9 cases)");
