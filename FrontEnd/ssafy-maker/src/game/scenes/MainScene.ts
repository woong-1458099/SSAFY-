// 씬 조립만 담당하고 디버그 오버레이에도 render bounds를 연결한다.
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { DebugMinigameHud } from "../../debug/overlay/DebugMinigameHud";
import { WorldGridOverlay } from "../../debug/overlay/WorldGridOverlay";
import { DEBUG_FLAGS } from "../../debug/config/debugFlags";
import { DebugCommandBus } from "../../debug/services/DebugCommandBus";
import { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import { DebugInputController } from "../../debug/services/DebugInputController";
import type { AreaId } from "../../common/enums/area";
import type { PlayerAppearanceSelection } from "../../common/types/player";
import { InventoryService } from "../../features/inventory/InventoryService";
import { SaveService, type SavePayload } from "../../features/save/SaveService";
import { DialogueBox } from "../../features/ui/components/DialogueBox";
import { GameHud } from "../../features/ui/components/GameHud";
import { SceneDirector } from "../directors/SceneDirector";
import { getAreaEntryPoint } from "../definitions/areas/areaDefinitions";
import { getStaticPlaceDefinitions } from "../definitions/places/placeDefinitions";
import {
  getAreaTransitionDefinitions,
  type AreaTransitionDefinition,
  type AreaTransitionId
} from "../definitions/places/areaTransitionDefinitions";
import { resolvePlayerAppearanceDefinition } from "../definitions/player/playerAppearanceResolver";
import { getSceneState } from "../definitions/sceneStates/sceneStateRegistry";
import { DialogueManager } from "../managers/DialogueManager";
import { InGameMenuManager } from "../managers/InGameMenuManager";
import {
  InteractionManager,
  type RuntimeStaticPlaceTarget
} from "../managers/InteractionManager";
import { NpcManager } from "../managers/NpcManager";
import { MinigameRewardManager } from "../managers/MinigameRewardManager";
import { PlaceActionManager } from "../managers/PlaceActionManager";
import { ProgressionManager } from "../managers/ProgressionManager";
import { PlayerManager } from "../managers/PlayerManager";
import { StatSystemManager } from "../managers/StatSystemManager";
import { WorldManager } from "../managers/WorldManager";
import type { SceneId } from "../scripts/scenes/sceneIds";
import {
  DEFAULT_START_SCENE_ID,
  getDefaultSceneIdForArea,
  getSceneScript
} from "../scripts/scenes/sceneRegistry";
import { buildRuntimeSceneScript, normalizeSceneState } from "../systems/sceneStateRuntime";
import { countTrueCells, findFirstWalkableTile } from "../systems/tmxNavigation";
import {
  AreaTransitionOverlay,
  type RuntimeAreaTransitionTarget
} from "../view/AreaTransitionOverlay";

export class MainScene extends Phaser.Scene {
  private static readonly PENDING_START_TILE_KEY = "pendingStartTile";
  private debugLogger?: DebugEventLogger;
  private debugOverlay?: DebugOverlay;
  private worldGridOverlay?: WorldGridOverlay;
  private debugMinigameHud?: DebugMinigameHud;
  private worldManager?: WorldManager;
  private playerManager?: PlayerManager;
  private npcManager?: NpcManager;
  private dialogueManager?: DialogueManager;
  private statSystemManager?: StatSystemManager;
  private inventoryService?: InventoryService;
  private saveService?: SaveService;
  private dialogueBox?: DialogueBox;
  private hud?: GameHud;
  private menuManager?: InGameMenuManager;
  private minigameRewardManager?: MinigameRewardManager;
  private placeActionManager?: PlaceActionManager;
  private progressionManager?: ProgressionManager;
  private interactionManager?: InteractionManager;
  private areaTransitionOverlay?: AreaTransitionOverlay;
  private debugCommandBus?: DebugCommandBus;
  private debugInputController?: DebugInputController;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private plannerKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super(SCENE_KEYS.main);
  }

  async create() {
    this.debugLogger = new DebugEventLogger();
    this.debugCommandBus = new DebugCommandBus();
    this.debugInputController = new DebugInputController(this, this.debugCommandBus);
    this.worldManager = new WorldManager(this);
    this.playerManager = new PlayerManager(this);
    this.npcManager = new NpcManager(this);
    this.dialogueManager = new DialogueManager(this);
    this.statSystemManager = new StatSystemManager();
    this.inventoryService = new InventoryService();
    this.saveService = new SaveService();
    this.dialogueBox = new DialogueBox(this);
    this.hud = new GameHud(this);
    this.dialogueManager.setDialogueBox(this.dialogueBox);
    this.menuManager = new InGameMenuManager({
      scene: this,
      getStatsState: () => this.statSystemManager!.getStatsState(),
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      inventoryService: this.inventoryService,
      saveService: this.saveService,
      buildSavePayload: () => this.buildSavePayload(),
      restoreSavePayload: (payload) => this.restoreSavePayload(payload)
    });
    this.statSystemManager.attachHud(this.hud);
    this.progressionManager = new ProgressionManager({
      scene: this,
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      onNotice: (message) => this.menuManager?.showNotice(message)
    });
    this.progressionManager.initialize();
    this.minigameRewardManager = new MinigameRewardManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier)
    });
    this.placeActionManager = new PlaceActionManager({
      scene: this,
      getHudState: () => this.statSystemManager!.getHudState(),
      patchHudState: (next) => this.statSystemManager!.patchHudState(next),
      applyStatDelta: (delta, multiplier = 1) => this.statSystemManager!.applyStatDelta(delta, multiplier),
      inventoryService: this.inventoryService,
      getTimeCycleIndex: () => this.progressionManager!.getTimeCycleIndex(),
      getActionPoint: () => this.progressionManager!.getActionPoint(),
      getMaxActionPoint: () => this.progressionManager!.getMaxActionPoint(),
      consumeActionPoint: () => this.progressionManager!.consumeActionPoint()
    });
    this.interactionManager = new InteractionManager(
      this,
      this.playerManager,
      this.npcManager,
      this.dialogueManager,
      this.debugLogger
    );
    this.interactionManager.setHud(this.hud);
    this.interactionManager.setPlaceInteractHandler((placeId) => this.placeActionManager?.open(placeId) === true);
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.plannerKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.statSystemManager.setStatsChangedListener(() => {
      this.menuManager?.refreshStatsUi();
    });
    this.inventoryService.setChangeListener(() => {
      this.menuManager?.refreshInventoryUi();
    });

    const director = new SceneDirector(
      this.npcManager,
      this.dialogueManager,
      this.debugLogger
    );
    this.interactionManager.setTransitionInteractHandler((transitionId) => {
      this.handleAreaTransition(transitionId);
    });
    const startScene = this.resolveStartScene();
    const initialSceneState = normalizeSceneState(getSceneState(startScene.initialStateId));
    const runtimeSceneScript = buildRuntimeSceneScript(startScene, initialSceneState);
    const playerAppearance = resolvePlayerAppearanceDefinition(
      this.registry.get("playerData") as Partial<PlayerAppearanceSelection> | undefined
    );

    this.worldManager.loadArea(runtimeSceneScript.area);
    this.playerManager.setAppearance(playerAppearance);
    this.npcManager.setArea(runtimeSceneScript.area);
    this.interactionManager.setArea(runtimeSceneScript.area);
    this.interactionManager.setSceneState(initialSceneState);
    this.statSystemManager.patchHudState({
      locationLabel: this.getAreaLabel(runtimeSceneScript.area)
    });

    const tmxConfig = this.worldManager.getCurrentTmxConfig();
    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const resolvedLayers = this.worldManager.getCurrentResolvedTmxLayers();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();

    this.playerManager.setRenderBounds(renderBounds);
    const transitionTargets = this.resolveAreaTransitionTargets(runtimeSceneScript.area, renderBounds);
    const staticPlaceTargets = this.resolveStaticPlaceTargets(runtimeSceneScript.area, renderBounds);
    this.interactionManager.setTransitionTargets(transitionTargets);
    this.interactionManager.setStaticPlaceTargets(staticPlaceTargets);

    const mapSize = parsedMap
      ? `${parsedMap.width}x${parsedMap.height} (${parsedMap.tileWidth}x${parsedMap.tileHeight})`
      : undefined;

    this.debugLogger.setArea(
      runtimeSceneScript.area,
      tmxConfig?.tmxKey,
      mapSize,
      resolvedLayers?.collisionLayers.length,
      resolvedLayers?.interactionLayers.length,
      resolvedLayers?.foregroundLayers.length,
      runtimeGrids ? countTrueCells(runtimeGrids.blockedGrid) : 0,
      runtimeGrids ? countTrueCells(runtimeGrids.interactionGrid) : 0
    );

    if (parsedMap && runtimeGrids && this.playerManager) {
      const startTile = this.resolvePlayerStartTile(runtimeSceneScript.area, parsedMap, runtimeGrids);
      this.playerManager.create(startTile.tileX, startTile.tileY, parsedMap.tileWidth);
    }

    if (DEBUG_FLAGS.overlayEnabled && this.debugLogger && this.npcManager) {
      this.debugOverlay = new DebugOverlay(this, this.debugLogger, this.npcManager);
      this.debugMinigameHud = new DebugMinigameHud(this);
    }

    if (DEBUG_FLAGS.worldGridEnabled) {
      this.worldGridOverlay = new WorldGridOverlay(this);
      this.worldGridOverlay.render(runtimeGrids, parsedMap, renderBounds);
    }

    this.areaTransitionOverlay = new AreaTransitionOverlay(this);
    this.areaTransitionOverlay.render(transitionTargets);

    this.bindDebugControls();
    this.debugInputController.bind();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.debugMinigameHud?.destroy();
      this.debugInputController?.destroy();
      this.dialogueManager?.destroy();
      this.dialogueBox?.destroy();
      this.minigameRewardManager?.destroy();
      this.placeActionManager?.destroy();
      this.progressionManager?.destroy();
      this.menuManager?.destroy();
      this.hud?.destroy();
    });

    await director.run(runtimeSceneScript);
  }

  update() {
    if (
      !this.worldManager ||
      !this.playerManager ||
      !this.debugLogger ||
      !this.interactionManager
    ) {
      return;
    }

    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();
    const debugHudVisible = this.debugMinigameHud?.isVisible() === true;
    const menuOpen = this.menuManager?.isOpen() === true;
    const placePopupOpen = this.placeActionManager?.isOpen() === true;
    const plannerOpen = this.progressionManager?.isPlannerOpen() === true;

    this.interactionManager.setOverlayBlocked(menuOpen || placePopupOpen || plannerOpen || debugHudVisible);
    this.playerManager.setInputLocked(
      this.interactionManager.isInputLocked() || debugHudVisible || menuOpen || placePopupOpen || plannerOpen
    );

    if (
      this.escapeKey &&
      Phaser.Input.Keyboard.JustDown(this.escapeKey) &&
      !this.dialogueManager?.isDialoguePlaying() &&
      !plannerOpen
    ) {
      if (placePopupOpen) {
        this.placeActionManager?.close();
        return;
      }
      this.menuManager?.toggle();
    }

    if (
      this.plannerKey &&
      Phaser.Input.Keyboard.JustDown(this.plannerKey) &&
      !this.dialogueManager?.isDialoguePlaying() &&
      !menuOpen &&
      !placePopupOpen &&
      !debugHudVisible
    ) {
      this.progressionManager?.togglePlanner();
    }

    this.playerManager.update(runtimeGrids, parsedMap);
    this.interactionManager.update();

    if (this.worldGridOverlay) {
      this.worldGridOverlay.render(runtimeGrids, parsedMap, renderBounds);
    }

    this.areaTransitionOverlay?.render(
      this.resolveAreaTransitionTargets(this.worldManager.getCurrentAreaId() ?? "world", renderBounds),
      this.interactionManager.getCurrentTargetTransitionId()
    );

    const player = this.playerManager.getSnapshot();
    if (player) {
      this.debugLogger.setPlayer(
        `${Math.round(player.x)}, ${Math.round(player.y)}`,
        `${player.tileX}, ${player.tileY}`
      );
    }

    this.debugOverlay?.render();
  }

  private bindDebugControls() {
    this.debugCommandBus?.subscribe((command) => {
      switch (command.type) {
        case "toggleDebugOverlay":
          if (this.debugOverlay) {
            const nextVisible = !this.debugOverlay.isVisible();
            this.debugOverlay.setVisible(nextVisible);
            if (!nextVisible) {
              this.debugMinigameHud?.hide();
            }
          }
          break;
        case "toggleWorldGrid":
          if (this.worldGridOverlay) {
            this.worldGridOverlay.setVisible(!this.worldGridOverlay.isVisible());
          }
          break;
        case "toggleMinigameHud":
          if (this.debugOverlay?.isVisible()) {
            this.debugMinigameHud?.toggle();
          }
          break;
        case "teleportPlayerToWorld":
          this.handleDebugTeleport(command.worldX, command.worldY);
          break;
        case "switchStartScene":
          this.registry.set("startSceneId", command.sceneId);
          this.debugLogger?.log(`debug:switch-scene:${command.sceneId}`);
          this.scene.restart();
          break;
      }
    });
  }

  private handleDebugTeleport(worldX: number, worldY: number) {
    if (!this.playerManager || !this.worldManager) {
      return;
    }

    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const renderBounds = this.worldManager.getCurrentRenderBounds();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();

    if (!parsedMap || !renderBounds || !runtimeGrids) {
      return;
    }

    const tileX = Math.floor((worldX - renderBounds.offsetX) / (renderBounds.tileWidth * renderBounds.scale));
    const tileY = Math.floor((worldY - renderBounds.offsetY) / (renderBounds.tileHeight * renderBounds.scale));

    if (tileX < 0 || tileY < 0 || tileX >= parsedMap.width || tileY >= parsedMap.height) {
      return;
    }

    if (runtimeGrids.blockedGrid[tileY]?.[tileX]) {
      this.debugLogger?.log(`debug:blocked-teleport:${tileX},${tileY}`);
      return;
    }

    if (this.playerManager.debugTeleportToTile(tileX, tileY)) {
      this.debugLogger?.log(`debug:teleport:${tileX},${tileY}`);
    }
  }

  private resolveStartScene() {
    const sceneId = (this.registry.get("startSceneId") as SceneId | undefined) ?? DEFAULT_START_SCENE_ID;
    return getSceneScript(sceneId) ?? getSceneScript(DEFAULT_START_SCENE_ID);
  }

  private restartWithScene(sceneId: SceneId) {
    this.registry.set("startSceneId", sceneId);
    this.scene.restart();
  }

  private handleAreaTransition(transitionId: AreaTransitionId) {
    const transition = getAreaTransitionDefinitions(this.worldManager?.getCurrentAreaId() ?? "world").find(
      (item) => item.id === transitionId
    );

    if (!transition) {
      this.debugLogger?.log(`debug:unhandled-transition:${transitionId}`);
      return;
    }

    const returnTransition = getAreaTransitionDefinitions(transition.toArea).find(
      (item) => item.toArea === transition.fromArea
    );

    if (returnTransition) {
      this.registry.set(
        MainScene.PENDING_START_TILE_KEY,
        this.resolveTransitionSpawnSeed(returnTransition)
      );
    }

    this.restartWithScene(getDefaultSceneIdForArea(transition.toArea));
  }

  private resolvePlayerStartTile(
    areaId: AreaId,
    parsedMap: NonNullable<ReturnType<WorldManager["getCurrentParsedTmxMap"]>>,
    runtimeGrids: NonNullable<ReturnType<WorldManager["getCurrentRuntimeGrids"]>>
  ) {
    const pendingStartTile = this.registry.get(MainScene.PENDING_START_TILE_KEY) as
      | { tileX: number; tileY: number }
      | undefined;

    if (pendingStartTile) {
      this.registry.remove(MainScene.PENDING_START_TILE_KEY);

      if (!runtimeGrids.blockedGrid[pendingStartTile.tileY]?.[pendingStartTile.tileX]) {
        return pendingStartTile;
      }
    }

    const entryPoint = getAreaEntryPoint(areaId);

    if (!entryPoint) {
      return findFirstWalkableTile(runtimeGrids.blockedGrid);
    }

    const tileX = Phaser.Math.Clamp(
      Math.floor(entryPoint.x / parsedMap.tileWidth),
      0,
      parsedMap.width - 1
    );
    const tileY = Phaser.Math.Clamp(
      Math.floor(entryPoint.y / parsedMap.tileHeight),
      0,
      parsedMap.height - 1
    );

    if (!runtimeGrids.blockedGrid[tileY]?.[tileX]) {
      return { tileX, tileY };
    }

    return findFirstWalkableTile(runtimeGrids.blockedGrid);
  }

  private resolveTransitionSpawnSeed(transition: AreaTransitionDefinition) {
    return {
      tileX: transition.tileX,
      tileY: transition.tileY
    };
  }

  private resolveAreaTransitionTargets(
    areaId: AreaId,
    renderBounds?: ReturnType<WorldManager["getCurrentRenderBounds"]>
  ): RuntimeAreaTransitionTarget[] {
    if (!renderBounds) {
      return [];
    }

    return getAreaTransitionDefinitions(areaId).map((transition) => ({
      id: transition.id,
      label: transition.label,
      centerX:
        renderBounds.offsetX +
        (transition.tileX + (transition.tileWidth ?? 1) / 2) *
          renderBounds.tileWidth *
          renderBounds.scale,
      centerY:
        renderBounds.offsetY +
        (transition.tileY + (transition.tileHeight ?? 1) / 2) *
          renderBounds.tileHeight *
          renderBounds.scale,
      zoneX:
        renderBounds.offsetX +
        transition.tileX * renderBounds.tileWidth * renderBounds.scale,
      zoneY:
        renderBounds.offsetY +
        transition.tileY * renderBounds.tileHeight * renderBounds.scale,
      zoneWidth:
        (transition.tileWidth ?? 1) * renderBounds.tileWidth * renderBounds.scale,
      zoneHeight:
        (transition.tileHeight ?? 1) * renderBounds.tileHeight * renderBounds.scale,
      tileX: transition.tileX,
      tileY: transition.tileY,
      tileWidth: transition.tileWidth ?? 1,
      tileHeight: transition.tileHeight ?? 1
    }));
  }

  private resolveStaticPlaceTargets(
    areaId: AreaId,
    renderBounds?: ReturnType<WorldManager["getCurrentRenderBounds"]>
  ): RuntimeStaticPlaceTarget[] {
    if (!renderBounds) {
      return [];
    }

    return getStaticPlaceDefinitions(areaId).map((place) => ({
      id: place.id,
      label: place.label,
      dialogueId: place.dialogueId!,
      x: renderBounds.offsetX + (place.zone.x + place.zone.width / 2) * renderBounds.scale,
      y: renderBounds.offsetY + (place.zone.y + place.zone.height / 2) * renderBounds.scale
    }));
  }

  private getAreaLabel(areaId: AreaId): string {
    switch (areaId) {
      case "campus":
        return "캠퍼스";
      case "downtown":
        return "번화가";
      case "world":
      default:
        return "전체 지도";
    }
  }

  private buildSavePayload(): SavePayload {
    return {
      gameState: this.statSystemManager!.getState(),
      inventory: this.inventoryService!.serialize(),
      progression: this.progressionManager?.getSnapshot()
    };
  }

  private restoreSavePayload(payload: SavePayload): boolean {
    if (!this.statSystemManager || !this.inventoryService || !this.progressionManager) {
      return false;
    }

    this.statSystemManager.restore(payload.gameState);
    this.inventoryService.restore(payload.inventory);
    this.progressionManager.restore(payload.progression);
    this.menuManager?.refreshStatsUi();
    this.menuManager?.refreshInventoryUi();
    return true;
  }
}
