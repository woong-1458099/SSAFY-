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
  private readonly keys: DebugKeys;

  constructor(
    private scene: Phaser.Scene,
    private commandBus: DebugCommandBus
  ) {
    this.keys = {
      overlay: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F1),
      panel: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F3),
      worldGrid: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F2),
      teleport: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      minigameHud: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M),
      world1: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      world1Numpad: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
      downtown2: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      downtown2Numpad: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
      campus3: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      campus3Numpad: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE)
    };
  }

  bind() {}

  update() {
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
    Object.values(this.keys).forEach((key) => key?.destroy());
  }

  private justPressed(key?: Phaser.Input.Keyboard.Key): boolean {
    return Boolean(key && Phaser.Input.Keyboard.JustDown(key));
  }
}
