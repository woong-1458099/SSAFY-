// 플레이어와 NPC 사이의 근접 상호작용과 대화 시작을 담당하는 상호작용 매니저
import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import type { NpcId } from "../../common/enums/npc";
import { getNpcPlacement, NPC_PLACEMENTS_BY_AREA } from "../definitions/npcs/npcPlacements";
import type { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import type { DialogueManager } from "./DialogueManager";
import type { NpcManager } from "./NpcManager";
import type { PlayerManager } from "./PlayerManager";

export class InteractionManager {
  private scene: Phaser.Scene;
  private playerManager: PlayerManager;
  private npcManager: NpcManager;
  private dialogueManager: DialogueManager;
  private debugLogger?: DebugEventLogger;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private currentAreaId?: AreaId;
  private isInteractionLocked = false;

  constructor(
    scene: Phaser.Scene,
    playerManager: PlayerManager,
    npcManager: NpcManager,
    dialogueManager: DialogueManager,
    debugLogger?: DebugEventLogger
  ) {
    this.scene = scene;
    this.playerManager = playerManager;
    this.npcManager = npcManager;
    this.dialogueManager = dialogueManager;
    this.debugLogger = debugLogger;
    this.interactKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  setArea(areaId: AreaId) {
    this.currentAreaId = areaId;
  }

  update() {
    if (
      !this.currentAreaId ||
      !this.interactKey ||
      this.dialogueManager.isDialoguePlaying() ||
      this.isInteractionLocked ||
      !Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      return;
    }

    const player = this.playerManager.getSnapshot();
    if (!player) {
      return;
    }

    const nearbyNpcId = this.findNearbyNpcId(player.x, player.y, this.currentAreaId);
    if (!nearbyNpcId) {
      return;
    }

    const placement = getNpcPlacement(this.currentAreaId, nearbyNpcId);
    if (!placement) {
      return;
    }

    this.debugLogger?.log(`interact:${nearbyNpcId}`);
    this.isInteractionLocked = true;

    this.dialogueManager.play(placement.dialogueId).finally(() => {
      this.isInteractionLocked = false;
    });
  }

  isInputLocked() {
    return this.isInteractionLocked || this.dialogueManager.isDialoguePlaying();
  }

  private findNearbyNpcId(playerX: number, playerY: number, areaId: AreaId): NpcId | undefined {
    const placements = NPC_PLACEMENTS_BY_AREA[areaId];

    for (const placement of placements) {
      const npcPosition = this.npcManager.getNpcWorldPosition(placement.npcId);
      if (!npcPosition) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        playerX,
        playerY,
        npcPosition.x,
        npcPosition.y
      );

      if (distance <= 72) {
        return placement.npcId;
      }
    }

    return undefined;
  }
}
