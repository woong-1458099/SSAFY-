import Phaser from "phaser";
import type { DebugEventLogger } from "../services/DebugEventLogger";
import type { NpcManager } from "../../game/managers/NpcManager";

export class DebugOverlay {
  private text: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    private logger: DebugEventLogger,
    private npcManager: NpcManager
  ) {
    this.text = scene.add.text(16, 16, "", {
      fontSize: "14px",
      color: "#00ff9c",
      backgroundColor: "#000000"
    }).setDepth(9999).setScrollFactor(0);
  }

  render() {
    const state = this.logger.getState();
    const npcs = this.npcManager.getSnapshot()
      .map((npc) => `${npc.id} (${Math.round(npc.x)}, ${Math.round(npc.y)}) ${npc.facing}`)
      .join("\n");

    this.text.setText([
      `[DEBUG]`,
      `sceneScript: ${state.currentSceneId}`,
      `action: ${state.currentAction}`,
      `npcs:`,
      npcs || "-",
      `events:`,
      ...state.events.slice(0, 5)
    ]);
  }
}
