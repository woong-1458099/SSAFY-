// 씬 조립만 담당하고 디버그 오버레이에도 render bounds를 연결한다.
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { WorldGridOverlay } from "../../debug/overlay/WorldGridOverlay";
import { DEBUG_FLAGS } from "../../debug/config/debugFlags";
import { DebugCommandBus } from "../../debug/services/DebugCommandBus";
import { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import { DebugInputController } from "../../debug/services/DebugInputController";
import type { AreaId, PlaceId } from "../../common/enums/area";
import type { PlayerAppearanceSelection } from "../../common/types/player";
import { SceneDirector } from "../directors/SceneDirector";
import { getAreaEntryPoint } from "../definitions/areas/areaDefinitions";
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

export class MainScene extends Phaser.Scene {
  private debugLogger?: DebugEventLogger;
  private debugOverlay?: DebugOverlay;
  private worldGridOverlay?: WorldGridOverlay;
  private worldManager?: WorldManager;
  private playerManager?: PlayerManager;
  private npcManager?: NpcManager;
  private dialogueManager?: DialogueManager;
  private interactionManager?: InteractionManager;
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
    this.interactionManager.setPlaceInteractHandler((placeId) => {
      this.handlePlaceAreaTransition(placeId);
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
    }

    if (DEBUG_FLAGS.worldGridEnabled) {
      this.worldGridOverlay = new WorldGridOverlay(this);
      this.worldGridOverlay.render(runtimeGrids, parsedMap, renderBounds);
    }

    this.bindDebugControls();
    this.debugInputController.bind();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
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

    this.playerManager.setInputLocked(this.interactionManager.isInputLocked());
    this.playerManager.update(runtimeGrids, parsedMap);
    this.interactionManager.update();

    if (this.worldGridOverlay) {
      this.worldGridOverlay.render(runtimeGrids, parsedMap, renderBounds);
    }

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
            this.debugOverlay.setVisible(!this.debugOverlay.isVisible());
          }
          break;
        case "toggleWorldGrid":
          if (this.worldGridOverlay) {
            this.worldGridOverlay.setVisible(!this.worldGridOverlay.isVisible());
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

  private handlePlaceAreaTransition(placeId: PlaceId) {
    switch (placeId) {
      case "downtown":
        this.restartWithScene(getDefaultSceneIdForArea("downtown"));
        return;
      case "campus":
        this.restartWithScene(getDefaultSceneIdForArea("campus"));
        return;
      default:
        this.debugLogger?.log(`debug:unhandled-place:${placeId}`);
    }
  }

  private resolvePlayerStartTile(
    areaId: AreaId,
    parsedMap: NonNullable<ReturnType<WorldManager["getCurrentParsedTmxMap"]>>,
    runtimeGrids: NonNullable<ReturnType<WorldManager["getCurrentRuntimeGrids"]>>
  ) {
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
}
