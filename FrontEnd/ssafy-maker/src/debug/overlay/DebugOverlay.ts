// 현재 씬, 지역, TMX 키, 맵 크기, 레이어 개수, 그리드 셀 개수, 플레이어 상태, 상호작용 대상 NPC를 화면에 표시하는 디버그 오버레이
import Phaser from "phaser";
import type { DebugEventLogger } from "../services/DebugEventLogger";
import type { NpcManager } from "../../game/managers/NpcManager";

export class DebugOverlay {
  private text: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    private logger: DebugEventLogger,
    private npcManager: NpcManager
  ) {
    this.text = scene.add.text(16, 16, "", {
      fontSize: "14px",
      color: "#00ff9c",
      backgroundColor: "#000000"
    }).setDepth(9999).setScrollFactor(0);
  }

  render() {
    const state = this.logger.getState();
    const npcs = this.npcManager.getSnapshot()
      .map((npc) => `${npc.id} (${Math.round(npc.x)}, ${Math.round(npc.y)}) ${npc.facing}`)
      .join("\n");

    this.text.setText([
      `[DEBUG]`,
      `area: ${state.currentAreaId ?? "-"}`,
      `tmx: ${state.currentTmxKey ?? "-"}`,
      `map: ${state.mapSize ?? "-"}`,
      `layers: c=${state.collisionLayerCount ?? 0}, i=${state.interactionLayerCount ?? 0}, f=${state.foregroundLayerCount ?? 0}`,
      `grid: blocked=${state.blockedCellCount ?? 0}, interaction=${state.interactionCellCount ?? 0}`,
      `player: ${state.playerPosition ?? "-"}`,
      `tile: ${state.playerTile ?? "-"}`,
      `targetNpc: ${state.targetNpcId ?? "-"}`,
      `sceneScript: ${state.currentSceneId}`,
      `action: ${state.currentAction}`,
      `npcs:`,
      npcs || "-",
      `events:`,
      ...state.events.slice(0, 5)
    ]);
  }
}
