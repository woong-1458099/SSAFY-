// 씬 액션과 현재 지역 및 TMX 레이어/그리드 상태, 플레이어 상태를 기록해 디버그 오버레이에 전달하는 이벤트 로거
import type { DebugState } from "../types/debugTypes";

export class DebugEventLogger {
  private events: string[] = [];
  private currentSceneId = "";
  private currentAction = "";
  private currentAreaId = "";
  private currentTmxKey = "";
  private mapSize = "";
  private collisionLayerCount = 0;
  private interactionLayerCount = 0;
  private foregroundLayerCount = 0;
  private blockedCellCount = 0;
  private interactionCellCount = 0;
  private playerPosition = "";
  private playerTile = "";

  log(message: string) {
    this.events.unshift(message);
    this.events = this.events.slice(0, 20);
  }

  setAction(sceneId: string, actionIndex: number, actionType: string) {
    this.currentSceneId = sceneId;
    this.currentAction = `${actionIndex}: ${actionType}`;
    this.log(`action:${sceneId}:${this.currentAction}`);
  }

  setArea(
    areaId: string,
    tmxKey?: string,
    mapSize?: string,
    collisionLayerCount?: number,
    interactionLayerCount?: number,
    foregroundLayerCount?: number,
    blockedCellCount?: number,
    interactionCellCount?: number
  ) {
    this.currentAreaId = areaId;
    this.currentTmxKey = tmxKey ?? "";
    this.mapSize = mapSize ?? "";
    this.collisionLayerCount = collisionLayerCount ?? 0;
    this.interactionLayerCount = interactionLayerCount ?? 0;
    this.foregroundLayerCount = foregroundLayerCount ?? 0;
    this.blockedCellCount = blockedCellCount ?? 0;
    this.interactionCellCount = interactionCellCount ?? 0;
  }

  setPlayer(position: string, tile: string) {
    this.playerPosition = position;
    this.playerTile = tile;
  }

  getState(): DebugState {
    return {
      currentSceneId: this.currentSceneId,
      currentAction: this.currentAction,
      currentAreaId: this.currentAreaId || undefined,
      currentTmxKey: this.currentTmxKey || undefined,
      mapSize: this.mapSize || undefined,
      collisionLayerCount: this.collisionLayerCount,
      interactionLayerCount: this.interactionLayerCount,
      foregroundLayerCount: this.foregroundLayerCount,
      blockedCellCount: this.blockedCellCount,
      interactionCellCount: this.interactionCellCount,
      playerPosition: this.playerPosition || undefined,
      playerTile: this.playerTile || undefined,
      events: this.events
    };
  }
}
