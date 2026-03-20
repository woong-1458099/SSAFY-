// 월드 매니저, 플레이어 매니저, NPC 매니저, 대화 매니저, 디렉터를 조립해 샘플 씬을 실행하는 메인 씬
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { SceneDirector } from "../directors/SceneDirector";
import { DialogueManager } from "../managers/DialogueManager";
import { NpcManager } from "../managers/NpcManager";
import { PlayerManager } from "../managers/PlayerManager";
import { WorldManager } from "../managers/WorldManager";
import { SCENE_001 } from "../scripts/scenes/scene_001";
import { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { WorldGridOverlay } from "../../debug/overlay/WorldGridOverlay";
import { DEBUG_FLAGS } from "../../debug/config/debugFlags";
import { countTrueCells } from "../systems/tmxNavigation";

export class MainScene extends Phaser.Scene {
  private debugLogger?: DebugEventLogger;
  private debugOverlay?: DebugOverlay;
  private worldGridOverlay?: WorldGridOverlay;
  private worldManager?: WorldManager;
  private playerManager?: PlayerManager;
  private npcManager?: NpcManager;

  constructor() {
    super(SCENE_KEYS.main);
  }

  async create() {
    this.debugLogger = new DebugEventLogger();
    this.worldManager = new WorldManager(this);
    this.playerManager = new PlayerManager(this);
    this.npcManager = new NpcManager(this);

    const dialogueManager = new DialogueManager(this);
    const director = new SceneDirector(this.npcManager, dialogueManager, this.debugLogger);

    this.worldManager.loadArea(SCENE_001.area);

    const tmxConfig = this.worldManager.getCurrentTmxConfig();
    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const resolvedLayers = this.worldManager.getCurrentResolvedTmxLayers();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();

    const mapSize = parsedMap
      ? `${parsedMap.width}x${parsedMap.height} (${parsedMap.tileWidth}x${parsedMap.tileHeight})`
      : undefined;

    this.debugLogger.setArea(
      SCENE_001.area,
      tmxConfig?.tmxKey,
      mapSize,
      resolvedLayers?.collisionLayers.length,
      resolvedLayers?.interactionLayers.length,
      resolvedLayers?.foregroundLayers.length,
      runtimeGrids ? countTrueCells(runtimeGrids.blockedGrid) : 0,
      runtimeGrids ? countTrueCells(runtimeGrids.interactionGrid) : 0
    );

    if (parsedMap && this.playerManager) {
      this.playerManager.create(1, 1, parsedMap.tileWidth);
    }

    if (DEBUG_FLAGS.overlayEnabled && this.debugLogger && this.npcManager) {
      this.debugOverlay = new DebugOverlay(this, this.debugLogger, this.npcManager);
    }

    if (DEBUG_FLAGS.worldGridEnabled) {
      this.worldGridOverlay = new WorldGridOverlay(this);
      this.worldGridOverlay.render(runtimeGrids, parsedMap);
    }

    await director.run(SCENE_001);
  }

  update() {
    if (!this.worldManager || !this.playerManager || !this.debugLogger) {
      return;
    }

    const parsedMap = this.worldManager.getCurrentParsedTmxMap();
    const runtimeGrids = this.worldManager.getCurrentRuntimeGrids();

    this.playerManager.update(runtimeGrids, parsedMap);

    const player = this.playerManager.getSnapshot();
    if (player) {
      this.debugLogger.setPlayer(
        `${Math.round(player.x)}, ${Math.round(player.y)}`,
        `${player.tileX}, ${player.tileY}`
      );
    }

    this.debugOverlay?.render();
  }
}
