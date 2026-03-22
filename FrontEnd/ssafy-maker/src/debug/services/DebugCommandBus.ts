// 디버그 입력과 실제 상태 변경을 분리하기 위한 명령 버스다.
import type { SceneId } from "../../game/scripts/scenes/sceneIds";
import type { PlayerStatKey } from "../../game/state/gameState";

export type DebugCommand =
  | { type: "toggleDebugOverlay" }
  | { type: "toggleDebugPanel" }
  | { type: "toggleWorldGrid" }
  | { type: "teleportPlayerToWorld"; worldX: number; worldY: number }
  | { type: "switchStartScene"; sceneId: SceneId }
  | { type: "toggleMinigameHud" }
  | { type: "adjustHudValue"; key: "hp" | "stress" | "money"; delta: number }
  | { type: "adjustStatValue"; key: PlayerStatKey; delta: number }
  | { type: "advanceTime" }
  | { type: "adjustWeek"; delta: number }
  | { type: "adjustActionPoint"; delta: number }
  | { type: "refillActionPoint" }
  | { type: "giveInventoryItem"; templateId: string }
  | { type: "triggerCurrentFixedEvent" }
  | { type: "saveAuto" };

type DebugCommandListener = (command: DebugCommand) => void;

export class DebugCommandBus {
  private listeners = new Set<DebugCommandListener>();

  subscribe(listener: DebugCommandListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(command: DebugCommand) {
    this.listeners.forEach((listener) => listener(command));
  }
}
