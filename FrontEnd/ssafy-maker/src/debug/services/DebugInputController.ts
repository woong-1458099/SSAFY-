import Phaser from "phaser";
import type { DebugCommand, DebugCommandBus } from "./DebugCommandBus";
import { SCENE_IDS } from "../../game/scripts/scenes/sceneIds";

type DebugBinding = {
  eventName: string;
  handler: (event: KeyboardEvent) => void;
};

// 디버그 입력은 명령만 발행하고 실제 상태 변경은 각 책임자에게 위임한다.
export class DebugInputController {
  private readonly keyboard?: Phaser.Input.Keyboard.KeyboardPlugin;
  private bindings: DebugBinding[] = [];
  private bound = false;
  private destroyed = false;

  constructor(
    private scene: Phaser.Scene,
    private commandBus: DebugCommandBus,
    private canHandleCommand: (command: DebugCommand) => boolean = () => true
  ) {
    this.keyboard = scene.input.keyboard;
  }

  bind() {
    if (this.destroyed || this.bound || !this.keyboard) {
      return;
    }

    this.bound = true;
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
      }),
      this.register("keydown-ONE", (event) => {
        this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.worldDefault }, event);
      }),
      this.register("keydown-NUMPAD_ONE", (event) => {
        this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.worldDefault }, event);
      }),
      this.register("keydown-TWO", (event) => {
        this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.downtownDefault }, event);
      }),
      this.register("keydown-NUMPAD_TWO", (event) => {
        this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.downtownDefault }, event);
      }),
      this.register("keydown-THREE", (event) => {
        this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.campusDefault }, event);
      }),
      this.register("keydown-NUMPAD_THREE", (event) => {
        this.emitIfAllowed({ type: "switchStartScene", sceneId: SCENE_IDS.campusDefault }, event);
      })
    ];
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.bound = false;
    this.destroyed = true;
    this.bindings.forEach(({ eventName, handler }) => {
      this.keyboard?.off(eventName, handler, this);
    });
    this.bindings = [];
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

  private consume(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private emitIfAllowed(command: DebugCommand, event: KeyboardEvent): void {
    if (!this.canHandleCommand(command)) {
      return;
    }

    this.consume(event);
    this.commandBus.emit(command);
  }
}
