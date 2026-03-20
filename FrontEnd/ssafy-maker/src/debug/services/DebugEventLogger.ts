// 씬 액션과 현재 지역 및 TMX 상태를 기록해 디버그 오버레이에 전달하는 이벤트 로거
import type { DebugState } from "../types/debugTypes";

export class DebugEventLogger {
  private events: string[] = [];
  private currentSceneId = "";
  private currentAction = "";
  private currentAreaId = "";
  private currentTmxKey = "";
  private mapSize = "";

  log(message: string) {
    this.events.unshift(message);
    this.events = this.events.slice(0, 20);
  }

  setAction(sceneId: string, actionIndex: number, actionType: string) {
    this.currentSceneId = sceneId;
    this.currentAction = `${actionIndex}: ${actionType}`;
    this.log(`action:${sceneId}:${this.currentAction}`);
  }

  setArea(areaId: string, tmxKey?: string, mapSize?: string) {
    this.currentAreaId = areaId;
    this.currentTmxKey = tmxKey ?? "";
    this.mapSize = mapSize ?? "";
    this.log(`area:${areaId}`);

    if (tmxKey) {
      this.log(`tmx:${tmxKey}`);
    }

    if (mapSize) {
      this.log(`map:${mapSize}`);
    }
  }

  getState(): DebugState {
    return {
      currentSceneId: this.currentSceneId,
      currentAction: this.currentAction,
      currentAreaId: this.currentAreaId || undefined,
      currentTmxKey: this.currentTmxKey || undefined,
      mapSize: this.mapSize || undefined,
      events: this.events
    };
  }
}
