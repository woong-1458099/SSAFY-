import Phaser from "phaser";
import type { DebugCommandBus } from "./DebugCommandBus";
import { SCENE_IDS } from "../../game/scripts/scenes/sceneIds";

type DebugKeys = {
  overlay?: Phaser.Input.Keyboard.Key;
  panel?: Phaser.Input.Keyboard.Key;
  worldGrid?: Phaser.Input.Keyboard.Key;
  teleport?: Phaser.Input.Keyboard.Key;
  minigameHud?: Phaser.Input.Keyboard.Key;
  world1?: Phaser.Input.Keyboard.Key;
  world1Numpad?: Phaser.Input.Keyboard.Key;
  downtown2?: Phaser.Input.Keyboard.Key;
  downtown2Numpad?: Phaser.Input.Keyboard.Key;
  campus3?: Phaser.Input.Keyboard.Key;
  campus3Numpad?: Phaser.Input.Keyboard.Key;
};

// 디버그 입력은 명령만 발행하고 실제 상태 변경은 각 책임자에게 위임한다.
export class DebugInputController {
  private readonly keyboard?: Phaser.Input.Keyboard.KeyboardPlugin;
  private keys: DebugKeys = {};
  private bound = false;
  private destroyed = false;

  constructor(
    private scene: Phaser.Scene,
    private commandBus: DebugCommandBus
  ) {
    this.keyboard = scene.input.keyboard;
    this.keys = this.createKeys();
  }

  bind() {
    if (this.destroyed || this.bound) {
      return;
    }

    this.bound = true;
    Object.values(this.keys).forEach((key) => key?.reset());
  }

  update() {
    if (!this.bound || this.destroyed) {
      return;
    }

    if (this.justPressed(this.keys.overlay)) {
      this.commandBus.emit({ type: "toggleDebugOverlay" });
    }

    if (this.justPressed(this.keys.panel)) {
      this.commandBus.emit({ type: "toggleDebugPanel" });
    }

    if (this.justPressed(this.keys.worldGrid)) {
      this.commandBus.emit({ type: "toggleWorldGrid" });
    }

    if (this.justPressed(this.keys.teleport)) {
      const pointer = this.scene.input.activePointer;
      this.commandBus.emit({
        type: "teleportPlayerToWorld",
        worldX: pointer.worldX,
        worldY: pointer.worldY
      });
    }

    if (this.justPressed(this.keys.minigameHud)) {
      this.commandBus.emit({ type: "toggleMinigameHud" });
    }

    if (this.justPressed(this.keys.world1) || this.justPressed(this.keys.world1Numpad)) {
      this.commandBus.emit({ type: "switchStartScene", sceneId: SCENE_IDS.worldDefault });
    }

    if (this.justPressed(this.keys.downtown2) || this.justPressed(this.keys.downtown2Numpad)) {
      this.commandBus.emit({ type: "switchStartScene", sceneId: SCENE_IDS.downtownDefault });
    }

    if (this.justPressed(this.keys.campus3) || this.justPressed(this.keys.campus3Numpad)) {
      this.commandBus.emit({ type: "switchStartScene", sceneId: SCENE_IDS.campusDefault });
    }
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.bound = false;
    this.destroyed = true;
    Object.values(this.keys).forEach((key) => {
      if (!key) {
        return;
      }
      key.reset();
      this.keyboard?.removeKey(key, true, false);
    });
    this.keys = {};
  }

  private justPressed(key?: Phaser.Input.Keyboard.Key): boolean {
    return Boolean(key && Phaser.Input.Keyboard.JustDown(key));
  }

  private createKeys(): DebugKeys {
    return {
      overlay: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F1),
      panel: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F3),
      worldGrid: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F2),
      teleport: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      minigameHud: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      world1: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      world1Numpad: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
      downtown2: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      downtown2Numpad: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
      campus3: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      campus3Numpad: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE)
    };
  }
}
