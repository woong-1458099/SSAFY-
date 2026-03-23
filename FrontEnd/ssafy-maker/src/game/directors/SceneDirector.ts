import type { SceneScript } from "../../common/types/sceneScript";
import type { DialogueManager } from "../managers/DialogueManager";
import type { NpcManager } from "../managers/NpcManager";
import type { DebugEventLogger } from "../../debug/services/DebugEventLogger";

export class SceneDirector {
  constructor(
    private npcManager: NpcManager,
    private dialogueManager: DialogueManager,
    private debugLogger: DebugEventLogger
  ) {}

  async run(script: SceneScript) {
    this.debugLogger.log(`scene:start:${script.id}`);

    for (let index = 0; index < script.actions.length; index += 1) {
      const action = script.actions[index];
      this.debugLogger.setAction(script.id, index, action.type);

      switch (action.type) {
        case "spawnNpc":
          this.npcManager.spawn(action.npcId, action.x, action.y, action.facing);
          break;
        case "moveNpc":
          await this.npcManager.moveTo(action.npcId, action.toX, action.toY, action.duration);
          break;
        case "turnNpc":
          this.npcManager.turn(action.npcId, action.facing);
          break;
        case "playDialogue":
          await this.dialogueManager.play(action.dialogueId as never);
          break;
        case "wait":
          await new Promise((resolve) => setTimeout(resolve, action.duration));
          break;
      }
    }

    this.debugLogger.log(`scene:end:${script.id}`);
  }
}
