// 플레이어와 NPC 사이의 근접 상호작용과 대화 시작, 상호작용 힌트 표시를 담당하는 상호작용 매니저
import Phaser from "phaser";
import type { AreaId } from "../../common/enums/area";
import type { NpcId } from "../../common/enums/npc";
import type { SceneState, SceneStateNpc } from "../../common/types/sceneState";
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
  private hintText?: Phaser.GameObjects.Text;
  private currentTargetNpcId?: NpcId;
  private requiresInteractKeyRelease = false;
  private wasDialoguePlaying = false;
  private currentSceneState?: SceneState;

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

  setSceneState(sceneState?: SceneState) {
    this.currentSceneState = sceneState;
  }

  update() {
    const isDialoguePlaying = this.dialogueManager.isDialoguePlaying();

    if (this.wasDialoguePlaying && !isDialoguePlaying) {
      this.requiresInteractKeyRelease = true;
    }
    this.wasDialoguePlaying = isDialoguePlaying;

    if (this.requiresInteractKeyRelease && this.interactKey && this.interactKey.isUp) {
      this.requiresInteractKeyRelease = false;
    }

    this.currentTargetNpcId = this.findCurrentTargetNpc();
    this.debugLogger?.setTargetNpc(this.currentTargetNpcId);
    this.renderHint();

    if (
      !this.currentAreaId ||
      !this.interactKey ||
      isDialoguePlaying ||
      this.isInteractionLocked ||
      this.requiresInteractKeyRelease ||
      !Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      return;
    }

    if (!this.currentTargetNpcId) {
      return;
    }

    const npcState = this.getCurrentSceneStateNpc(this.currentTargetNpcId);
    if (!npcState) {
      return;
    }

    this.debugLogger?.log(`interact:${this.currentTargetNpcId}`);
    this.isInteractionLocked = true;

    this.dialogueManager.play(npcState.dialogueId).finally(() => {
      this.isInteractionLocked = false;
      this.requiresInteractKeyRelease = true;
    });
  }

  isInputLocked() {
    return this.isInteractionLocked || this.dialogueManager.isDialoguePlaying();
  }

  private findCurrentTargetNpc() {
    if (!this.currentAreaId) {
      return undefined;
    }

    const player = this.playerManager.getSnapshot();
    if (!player) {
      return undefined;
    }

    return this.findNearbyNpcId(player.x, player.y, this.currentAreaId);
  }

  private findNearbyNpcId(playerX: number, playerY: number, areaId: AreaId): NpcId | undefined {
    const placements = this.getCurrentSceneStateNpcs(areaId);

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

  private getCurrentSceneStateNpcs(areaId: AreaId): SceneStateNpc[] {
    if (!this.currentSceneState || this.currentSceneState.area !== areaId) {
      return [];
    }

    return this.currentSceneState.npcs;
  }

  private getCurrentSceneStateNpc(npcId: NpcId) {
    return this.currentSceneState?.npcs.find((npc) => npc.npcId === npcId);
  }

  private renderHint() {
    if (!this.hintText) {
      this.hintText = this.scene.add.text(640, 40, "", {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#000000"
      })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(9500);
    }

    if (
      this.currentTargetNpcId &&
      !this.dialogueManager.isDialoguePlaying() &&
      !this.requiresInteractKeyRelease
    ) {
      this.hintText.setText(`[SPACE] ${this.currentTargetNpcId}와 대화`);
      this.hintText.setVisible(true);
      return;
    }

    this.hintText.setVisible(false);
  }
}
