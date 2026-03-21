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
import type { AreaId, PlaceId } from "../../common/enums/area";
import type { PlayerAppearanceSelection } from "../../common/types/player";
import { SceneDirector } from "../directors/SceneDirector";
import { getAreaEntryPoint } from "../definitions/areas/areaDefinitions";
import {
  getAreaTransitionDefinitions,
  type AreaTransitionDefinition,
  type AreaTransitionId
} from "../definitions/places/areaTransitionDefinitions";
import { resolvePlayerAppearanceDefinition } from "../definitions/player/playerAppearanceResolver";
import { getSceneState } from "../definitions/sceneStates/sceneStateRegistry";
import { DialogueManager } from "../managers/DialogueManager";
import { InteractionManager } from "../managers/InteractionManager";
import { NpcManager } from "../managers/NpcManager";
import { PlayerManager } from "../managers/PlayerManager";
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
  private interactionManager?: InteractionManager;
  private areaTransitionOverlay?: AreaTransitionOverlay;
  private debugCommandBus?: DebugCommandBus;
  private debugInputController?: DebugInputController;

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
    this.interactionManager = new InteractionManager(
      this,
      this.playerManager,
      this.npcManager,
      this.dialogueManager,
      this.debugLogger
    );

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

    const tmxConfig = this.worldManager.getCurrentTmxConfig();
    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const resolvedLayers = this.worldManager.getCurrentResolvedTmxLayers();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();
    const renderBounds = this.worldManager.getCurrentRenderBounds();

    this.playerManager.setRenderBounds(renderBounds);
    const transitionTargets = this.resolveAreaTransitionTargets(runtimeSceneScript.area, renderBounds);
    this.interactionManager.setTransitionTargets(transitionTargets);

    const mapSize = parsedMap
      ? `${parsedMap.width}x${parsedMap.height} (${parsedMap.tileWidth}x${parsedMap.tileHeight})`
      : undefined;

    this.debugLogger.setArea(
      runtimeSceneScript.area,
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

    this.playerManager.setInputLocked(
      this.interactionManager.isInputLocked() || this.debugMinigameHud?.isVisible() === true
    );
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
}
