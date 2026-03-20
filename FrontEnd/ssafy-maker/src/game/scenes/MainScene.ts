// 월드 매니저, NPC 매니저, 대화 매니저, 디렉터를 조립해 샘플 씬을 실행하는 메인 씬
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { SceneDirector } from "../directors/SceneDirector";
import { DialogueManager } from "../managers/DialogueManager";
import { NpcManager } from "../managers/NpcManager";
import { WorldManager } from "../managers/WorldManager";
import { SCENE_001 } from "../scripts/scenes/scene_001";
import { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { DEBUG_FLAGS } from "../../debug/config/debugFlags";
import { countTrueCells } from "../systems/tmxNavigation";

export class MainScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.main);
  }

  async create() {
    const debugLogger = new DebugEventLogger();
    const worldManager = new WorldManager(this);
    const npcManager = new NpcManager(this);
    const dialogueManager = new DialogueManager(this);
    const director = new SceneDirector(npcManager, dialogueManager, debugLogger);

    worldManager.loadArea(SCENE_001.area);

    const tmxConfig = worldManager.getCurrentTmxConfig();
    const parsedMap = worldManager.getCurrentParsedTmxMap();
    const resolvedLayers = worldManager.getCurrentResolvedTmxLayers();
    const runtimeGrids = worldManager.getCurrentRuntimeGrids();

    const mapSize = parsedMap
      ? `${parsedMap.width}x${parsedMap.height} (${parsedMap.tileWidth}x${parsedMap.tileHeight})`
      : undefined;

    debugLogger.setArea(
      SCENE_001.area,
      tmxConfig?.tmxKey,
      mapSize,
      resolvedLayers?.collisionLayers.length,
      resolvedLayers?.interactionLayers.length,
      resolvedLayers?.foregroundLayers.length,
      runtimeGrids ? countTrueCells(runtimeGrids.blockedGrid) : 0,
      runtimeGrids ? countTrueCells(runtimeGrids.interactionGrid) : 0
    );

    let overlay: DebugOverlay | undefined;
    if (DEBUG_FLAGS.overlayEnabled) {
      overlay = new DebugOverlay(this, debugLogger, npcManager);
      this.events.on("update", () => overlay?.render());
    }

    await director.run(SCENE_001);
  }
}
