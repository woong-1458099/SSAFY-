import Phaser from "phaser";
import type { DebugCommandBus } from "./DebugCommandBus";
import { SCENE_IDS } from "../../game/scripts/scenes/sceneIds";

// 디버그 입력은 명령만 발행하고 실제 상태 변경은 각 책임자에게 위임한다.
export class DebugInputController {
  private readonly handleNumberKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const code = event.code;
    const key = event.key;

    if (code === "Digit1" || code === "Numpad1" || key === "1") {
      this.handleSwitchWorld();
      return;
    }

    if (code === "Digit2" || code === "Numpad2" || key === "2") {
      this.handleSwitchDowntown();
      return;
    }

    if (code === "Digit3" || code === "Numpad3" || key === "3") {
      this.handleSwitchCampus();
    }
  };

  constructor(
    private scene: Phaser.Scene,
    private commandBus: DebugCommandBus
  ) {}

  bind() {
    this.scene.input.keyboard?.on("keydown-F1", this.handleToggleOverlay, this);
    this.scene.input.keyboard?.on("keydown-F2", this.handleToggleWorldGrid, this);
    this.scene.input.keyboard?.on("keydown-T", this.handleTeleportPlayer, this);
    this.scene.input.keyboard?.on("keydown-M", this.handleToggleMinigameHud, this);
    this.scene.input.keyboard?.on("keydown", this.handleNumberKeyDown);
  }

  destroy() {
    this.scene.input.keyboard?.off("keydown-F1", this.handleToggleOverlay, this);
    this.scene.input.keyboard?.off("keydown-F2", this.handleToggleWorldGrid, this);
    this.scene.input.keyboard?.off("keydown-T", this.handleTeleportPlayer, this);
    this.scene.input.keyboard?.off("keydown-M", this.handleToggleMinigameHud, this);
    this.scene.input.keyboard?.off("keydown", this.handleNumberKeyDown);
  }

  private handleToggleOverlay() {
    this.commandBus.emit({ type: "toggleDebugOverlay" });
  }

  private handleToggleWorldGrid() {
    this.commandBus.emit({ type: "toggleWorldGrid" });
  }

  private handleTeleportPlayer() {
    const pointer = this.scene.input.activePointer;
    this.commandBus.emit({
      type: "teleportPlayerToWorld",
      worldX: pointer.worldX,
      worldY: pointer.worldY
    });
  }

  private handleToggleMinigameHud() {
    this.commandBus.emit({ type: "toggleMinigameHud" });
  }

  private handleSwitchWorld() {
    this.commandBus.emit({ type: "switchStartScene", sceneId: SCENE_IDS.worldDefault });
  }

  private handleSwitchDowntown() {
    this.commandBus.emit({ type: "switchStartScene", sceneId: SCENE_IDS.downtownDefault });
  }

  private handleSwitchCampus() {
    this.commandBus.emit({ type: "switchStartScene", sceneId: SCENE_IDS.campusDefault });
  }
}
