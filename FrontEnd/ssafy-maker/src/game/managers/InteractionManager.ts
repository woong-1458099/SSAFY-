import Phaser from "phaser";
import type { AreaId, PlaceId } from "../../common/enums/area";
import type { NpcId } from "../../common/enums/npc";
import type { DialogueScriptId } from "../../common/types/dialogue";
import type { SceneState, SceneStateNpc } from "../../common/types/sceneState";
import type { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import type { GameHud } from "../../features/ui/components/GameHud";
import type { AreaTransitionId } from "../definitions/places/areaTransitionDefinitions";
import type { RuntimeAreaTransitionTarget } from "../view/AreaTransitionOverlay";
import type { DialogueManager } from "./DialogueManager";
import type { NpcManager } from "./NpcManager";
import type { PlayerManager } from "./PlayerManager";

export type RuntimeStaticPlaceTarget = {
  id: PlaceId;
  label: string;
  dialogueId: DialogueScriptId;
  x: number;
  y: number;
  zoneX: number;
  zoneY: number;
  zoneWidth: number;
  zoneHeight: number;
  promptTiles?: Array<{ tileX: number; tileY: number }>;
};

export const PLACE_INTERACTION_PADDING = 24;

export class InteractionManager {
  private scene: Phaser.Scene;
  private playerManager: PlayerManager;
  private npcManager: NpcManager;
  private dialogueManager: DialogueManager;
  private debugLogger?: DebugEventLogger;
  private interactKey?: Phaser.Input.Keyboard.Key;
  private currentAreaId?: AreaId;
  private isInteractionLocked = false;
  private hud?: GameHud;
  private currentTargetNpcId?: NpcId;
  private currentTargetTransitionId?: AreaTransitionId;
  private currentTargetPlaceId?: PlaceId;
  private requiresInteractKeyRelease = false;
  private wasDialoguePlaying = false;
  private currentSceneState?: SceneState;
  private onTransitionInteract?: (transitionId: AreaTransitionId) => void;
  private onPlaceInteract?: (placeId: PlaceId) => boolean | void;
  private currentTransitionTargets: RuntimeAreaTransitionTarget[] = [];
  private currentStaticPlaceTargets: RuntimeStaticPlaceTarget[] = [];
  private overlayBlocked = false;

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

  setTransitionTargets(targets: RuntimeAreaTransitionTarget[]) {
    this.currentTransitionTargets = targets;
  }

  setStaticPlaceTargets(targets: RuntimeStaticPlaceTarget[]) {
    this.currentStaticPlaceTargets = targets;
  }

  setTransitionInteractHandler(handler?: (transitionId: AreaTransitionId) => void) {
    this.onTransitionInteract = handler;
  }

  setPlaceInteractHandler(handler?: (placeId: PlaceId) => boolean | void) {
    this.onPlaceInteract = handler;
  }

  setHud(hud?: GameHud) {
    this.hud = hud;
  }

  setOverlayBlocked(blocked: boolean) {
    this.overlayBlocked = blocked;
    if (blocked) {
      this.hud?.setInteractionPrompt(null);
    }
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
    this.currentTargetTransitionId = this.findCurrentTargetTransition();
    this.currentTargetPlaceId = this.findCurrentTargetPlace();
    this.debugLogger?.setTargetNpc(this.currentTargetNpcId);
    this.renderHint();

    if (
      !this.currentAreaId ||
      !this.interactKey ||
      isDialoguePlaying ||
      this.isInteractionLocked ||
      this.overlayBlocked ||
      this.requiresInteractKeyRelease ||
      !Phaser.Input.Keyboard.JustDown(this.interactKey)
    ) {
      return;
    }

    if (this.currentTargetNpcId) {
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
      return;
    }

    if (this.currentTargetTransitionId && this.onTransitionInteract) {
      this.debugLogger?.log(`interact:transition:${this.currentTargetTransitionId}`);
      this.requiresInteractKeyRelease = true;
      this.onTransitionInteract(this.currentTargetTransitionId);
      return;
    }

    if (!this.currentTargetPlaceId) {
      return;
    }

    const place = this.currentStaticPlaceTargets.find((item) => item.id === this.currentTargetPlaceId);
    if (!place) {
      return;
    }

    if (this.onPlaceInteract?.(place.id) === true) {
      this.requiresInteractKeyRelease = true;
      return;
    }

    this.debugLogger?.log(`interact:place:${this.currentTargetPlaceId}`);
    this.isInteractionLocked = true;
    this.dialogueManager.play(place.dialogueId).finally(() => {
      this.isInteractionLocked = false;
      this.requiresInteractKeyRelease = true;
    });
  }

  isInputLocked() {
    return this.isInteractionLocked || this.dialogueManager.isDialoguePlaying();
  }

  getCurrentTargetTransitionId() {
    return this.currentTargetTransitionId;
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

  private findCurrentTargetTransition() {
    const player = this.playerManager.getSnapshot();
    if (!player) {
      return undefined;
    }

    for (const transition of this.currentTransitionTargets) {
      const maxTileX = transition.tileX + transition.tileWidth - 1;
      const maxTileY = transition.tileY + transition.tileHeight - 1;

      if (
        player.tileX >= transition.tileX &&
        player.tileX <= maxTileX &&
        player.tileY >= transition.tileY &&
        player.tileY <= maxTileY
      ) {
        return transition.id;
      }
    }

    return undefined;
  }

  private findCurrentTargetPlace() {
    if (!this.currentAreaId) {
      return undefined;
    }

    const player = this.playerManager.getSnapshot();
    if (!player) {
      return undefined;
    }

    for (const place of this.currentStaticPlaceTargets) {
      if (
        place.promptTiles?.some(
          (tile) => tile.tileX === player.tileX && tile.tileY === player.tileY
        )
      ) {
        return place.id;
      }
    }

    for (const place of this.currentStaticPlaceTargets) {
      const minX = place.zoneX - PLACE_INTERACTION_PADDING;
      const maxX = place.zoneX + place.zoneWidth + PLACE_INTERACTION_PADDING;
      const minY = place.zoneY - PLACE_INTERACTION_PADDING;
      const maxY = place.zoneY + place.zoneHeight + PLACE_INTERACTION_PADDING;

      if (player.x >= minX && player.x <= maxX && player.y >= minY && player.y <= maxY) {
        return place.id;
      }
    }

    return undefined;
  }

  private findNearbyNpcId(playerX: number, playerY: number, areaId: AreaId): NpcId | undefined {
    const placements = this.getCurrentSceneStateNpcs(areaId);

    for (const placement of placements) {
      const npcPosition = this.npcManager.getNpcWorldPosition(placement.npcId);
      if (!npcPosition) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(playerX, playerY, npcPosition.x, npcPosition.y);

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
    if (!this.hud) {
      return;
    }

    if (
      !this.overlayBlocked &&
      this.currentTargetNpcId &&
      !this.dialogueManager.isDialoguePlaying() &&
      !this.requiresInteractKeyRelease
    ) {
      this.hud.setInteractionPrompt(`[SPACE] ${this.currentTargetNpcId}와 대화`);
      return;
    }

    if (
      !this.overlayBlocked &&
      this.currentTargetTransitionId &&
      !this.dialogueManager.isDialoguePlaying() &&
      !this.requiresInteractKeyRelease
    ) {
      const transition = this.currentTransitionTargets.find(
        (target) => target.id === this.currentTargetTransitionId
      );
      this.hud.setInteractionPrompt(`[SPACE] ${transition?.label ?? "이동"}`);
      return;
    }

    if (
      !this.overlayBlocked &&
      this.currentTargetPlaceId &&
      !this.dialogueManager.isDialoguePlaying() &&
      !this.requiresInteractKeyRelease
    ) {
      const place = this.currentStaticPlaceTargets.find((item) => item.id === this.currentTargetPlaceId);
      this.hud.setInteractionPrompt(`[SPACE] ${place?.label ?? "장소"} 확인`);
      return;
    }

    this.hud.setInteractionPrompt(null);
  }
}
