import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { AREA_DEFINITIONS } from "../definitions/areas/areaDefinitions";
import { SceneDirector } from "../directors/SceneDirector";
import { DialogueManager } from "../managers/DialogueManager";
import { NpcManager } from "../managers/NpcManager";
import { SCENE_001 } from "../scripts/scenes/scene_001";
import { DebugEventLogger } from "../../debug/services/DebugEventLogger";
import { DebugOverlay } from "../../debug/overlay/DebugOverlay";
import { DEBUG_FLAGS } from "../../debug/config/debugFlags";

export class MainScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.main);
  }

  async create() {
    const area = AREA_DEFINITIONS[SCENE_001.area];
    this.add.rectangle(640, 360, 1280, 720, 0x31473a);
    this.add.text(24, 24, area.label, { fontSize: "28px", color: "#ffffff" });

    const npcManager = new NpcManager(this);
    const dialogueManager = new DialogueManager(this);
    const debugLogger = new DebugEventLogger();
    const director = new SceneDirector(npcManager, dialogueManager, debugLogger);

    let overlay: DebugOverlay | undefined;
    if (DEBUG_FLAGS.overlayEnabled) {
      overlay = new DebugOverlay(this, debugLogger, npcManager);
      this.events.on("update", () => overlay?.render());
    }

    await director.run(SCENE_001);
  }
}
