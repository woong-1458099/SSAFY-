import type { HudState, PlayerStatsState } from "../../game/state/gameState";
import type { FixedEventDebugEntry } from "../../features/story/fixedEventDebug";
import type { EndingId, EndingSummaryStat } from "../../features/progression/types/ending";

// 디버그 오버레이에서 표시할 월드와 액션 상태 타입 정의
export type DebugState = {
  currentSceneId: string;
  currentAction: string;
  currentAreaId?: string;
  currentTmxKey?: string;
  mapSize?: string;
  collisionLayerCount?: number;
  interactionLayerCount?: number;
  foregroundLayerCount?: number;
  blockedCellCount?: number;
  interactionCellCount?: number;
  playerPosition?: string;
  playerTile?: string;
  targetNpcId?: string;
  events: string[];
};

export type DebugPanelState = {
  currentSceneId: string;
  currentAreaId?: string;
  currentLocationLabel: string;
  inventoryUsageText: string;
  fixedEventId?: string;
  hud: HudState;
  stats: PlayerStatsState;
  endingDebug: {
    endingId: EndingId;
    title: string;
    shortDescription: string;
    dominantLabels: string[];
    summaryStats: EndingSummaryStat[];
    introLines: string[];
    npcLine: string;
  };
  storyDebug: {
    currentWeek: number;
    weeks: Array<{
      week: number;
      loaded: boolean;
      events: FixedEventDebugEntry[];
    }>;
  };
};
