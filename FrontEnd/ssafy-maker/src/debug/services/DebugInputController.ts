import Phaser from "phaser";
import type { DebugCommand, DebugCommandBus } from "./DebugCommandBus";
import { SCENE_IDS } from "../../game/scripts/scenes/sceneIds";

type DebugBinding = {
  eventName: string;
  handler: (event: KeyboardEvent) => void;
};

const DEBUG_CAPTURE_KEY_CODES = [
  Phaser.Input.Keyboard.KeyCodes.F1,
  Phaser.Input.Keyboard.KeyCodes.F2,
  Phaser.Input.Keyboard.KeyCodes.F3,
  Phaser.Input.Keyboard.KeyCodes.F4,
  Phaser.Input.Keyboard.KeyCodes.T,
  Phaser.Input.Keyboard.KeyCodes.M
];

type SceneSwitchKeys = {
  world?: Phaser.Input.Keyboard.Key;
  worldNumpad?: Phaser.Input.Keyboard.Key;
  downtown?: Phaser.Input.Keyboard.Key;
  downtownNumpad?: Phaser.Input.Keyboard.Key;
  campus?: Phaser.Input.Keyboard.Key;
  campusNumpad?: Phaser.Input.Keyboard.Key;
};

// 디버그 입력은 명령만 발행하고 실제 상태 변경은 각 책임자에게 위임한다.
export class DebugInputController {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null;
  private bindings: DebugBinding[] = [];
  private sceneSwitchKeys: SceneSwitchKeys = {};
  private bound = false;
  private destroyed = false;
  private lifecycleBound = false;

  constructor(
    private scene: Phaser.Scene,
    private commandBus: DebugCommandBus,
    private canHandleCommand: (command: DebugCommand) => boolean = () => true
  ) {
    this.keyboard = scene.input.keyboard;
    this.sceneSwitchKeys = this.createSceneSwitchKeys();
    this.bindSceneLifecycle();
  }

  bind() {
    if (this.destroyed || this.bound || !this.keyboard) {
      return;
    }

    this.clearBindings();
    this.bound = true;
    this.keyboard.addCapture(DEBUG_CAPTURE_KEY_CODES);
    this.bindings = [
      this.register("keydown-F1", (event) => {
        this.emitIfAllowed({ type: "toggleDebugOverlay" }, event);
      }),
      this.register("keydown-F2", (event) => {
        this.emitIfAllowed({ type: "toggleWorldGrid" }, event);
      }),
      this.register("keydown-F3", (event) => {
        this.emitIfAllowed({ type: "toggleDebugPanel" }, event);
      }),
      this.register("keydown-F4", (event) => {
        this.emitIfAllowed({ type: "toggleWorldTileEditor" }, event);
      }),
      this.register("keydown-T", (event) => {
        const pointer = this.scene.input.activePointer;
        this.emitIfAllowed({
          type: "teleportPlayerToWorld",
          worldX: pointer.worldX,
          worldY: pointer.worldY
        }, event);
      }),
      this.register("keydown-M", (event) => {
        this.emitIfAllowed({ type: "toggleMinigameHud" }, event);
      })
    ];
  }

  update() {
    if (!this.bound || this.destroyed) {
      return;
    }

    if (this.justPressed(this.sceneSwitchKeys.world) || this.justPressed(this.sceneSwitchKeys.worldNumpad)) {
      this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.worldDefault });
      return;
    }

    if (this.justPressed(this.sceneSwitchKeys.downtown) || this.justPressed(this.sceneSwitchKeys.downtownNumpad)) {
      this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.downtownDefault });
      return;
    }

    if (this.justPressed(this.sceneSwitchKeys.campus) || this.justPressed(this.sceneSwitchKeys.campusNumpad)) {
      this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.campusDefault });
    }
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.bound = false;
    this.destroyed = true;
    this.clearBindings();
    this.keyboard?.removeCapture(DEBUG_CAPTURE_KEY_CODES);
    Object.values(this.sceneSwitchKeys).forEach((key) => {
      if (key) {
        key.reset();
        this.keyboard?.removeKey(key, false, false);
      }
    });
    this.bindings = [];
    this.sceneSwitchKeys = {};
  }

  private register(eventName: string, listener: (event: KeyboardEvent) => void): DebugBinding {
    const handler = (event: KeyboardEvent) => {
      if (!this.bound || this.destroyed || event.repeat) {
        return;
      }

      listener(event);
    };

    this.keyboard?.on(eventName, handler, this);
    return { eventName, handler };
  }

  private bindSceneLifecycle(): void {
    if (this.lifecycleBound) {
      return;
    }

    this.lifecycleBound = true;
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }

  private clearBindings(): void {
    this.bindings.forEach(({ eventName, handler }) => {
      this.keyboard?.off(eventName, handler, this);
    });
    this.bindings = [];
  }

  private consume(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private emitIfAllowed(command: DebugCommand, event?: KeyboardEvent): void {
    if (!this.canHandleCommand(command)) {
      return;
    }

    if (event) {
      this.consume(event);
    }
    this.commandBus.emit(command);
  }

  private justPressed(key?: Phaser.Input.Keyboard.Key): boolean {
    return Boolean(key && Phaser.Input.Keyboard.JustDown(key));
  }

  private createSceneSwitchKeys(): SceneSwitchKeys {
    return {
      world: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE, false),
      worldNumpad: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE, false),
      downtown: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO, false),
      downtownNumpad: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO, false),
      campus: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.THREE, false),
      campusNumpad: this.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE, false)
    };
  }
}
