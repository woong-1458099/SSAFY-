// 현재 씬, 지역, TMX 키, 맵 크기, 레이어 개수, 그리드 셀 개수, 플레이어 상태, 상호작용 대상 NPC를 화면에 표시하는 디버그 오버레이
import Phaser from "phaser";
import type { DebugEventLogger } from "../services/DebugEventLogger";
import type { NpcManager } from "../../game/managers/NpcManager";
import { UI_DEPTH } from "../../game/systems/uiDepth";

export class DebugOverlay {
  private text: Phaser.GameObjects.Text;
  private helpText: Phaser.GameObjects.Text;
  private visible = true;

  constructor(
    private scene: Phaser.Scene,
    private logger: DebugEventLogger,
    private npcManager: NpcManager
  ) {
    this.text = scene.add.text(16, 16, "", {
      fontSize: "14px",
      color: "#00ff9c",
      backgroundColor: "#000000"
    }).setDepth(UI_DEPTH.debugOverlay).setScrollFactor(0);

    this.helpText = scene.add.text(0, 16, "", {
      fontSize: "14px",
      color: "#ffe082",
      backgroundColor: "#000000",
      align: "right"
    }).setDepth(UI_DEPTH.debugOverlay).setScrollFactor(0).setOrigin(1, 0);
  }

  render() {
    if (!this.visible) {
      this.text.setVisible(false);
      this.helpText.setVisible(false);
      return;
    }

    this.text.setVisible(true);
    this.helpText.setVisible(true);
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

    this.helpText.setPosition(this.scene.scale.width - 16, 16);
    this.helpText.setText([
      `[DEBUG KEYS]`,
      `F1 디버그 모드 ON/OFF`,
      `F2 히트박스 ON/OFF`,
      `F3 디버그 패널`,
      `T 마우스 위치로 순간이동`,
      `M 미니게임 HUD`,
      `1 전체지도 이동`,
      `2 번화가 이동`,
      `3 강의장 이동`
    ]);
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.text.setVisible(visible);
    this.helpText.setVisible(visible);
  }

  isVisible() {
    return this.visible;
  }
}
