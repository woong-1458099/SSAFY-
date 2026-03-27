import type { DebugPanelState } from "../../../debug/types/debugTypes";
import type { EndingResult } from "../../../features/progression/types/ending";
import type { HudState, PlayerStatsState } from "../../state/gameState";

type StoryWeekDebug = {
  week: number;
  loaded: boolean;
  events: unknown[];
};

type BuildMainSceneDebugPanelStateArgs = {
  currentSceneId?: string;
  currentAreaId?: string;
  currentLocationLabel: string;
  usedSlotCount: number;
  totalSlotCount: number;
  fixedEventId?: string;
  hud: HudState;
  stats: PlayerStatsState;
  ending: EndingResult;
  storyWeeks: StoryWeekDebug[];
};

export function buildMainSceneDebugPanelState(
  args: BuildMainSceneDebugPanelStateArgs
): DebugPanelState {
  return {
    currentSceneId: args.currentSceneId ?? "-",
    currentAreaId: args.currentAreaId,
    currentLocationLabel: args.currentLocationLabel,
    inventoryUsageText: `${args.usedSlotCount}/${args.totalSlotCount}`,
    fixedEventId: args.fixedEventId,
    hud: args.hud,
    stats: args.stats,
    endingDebug: {
      endingId: args.ending.endingId,
      title: args.ending.title,
      shortDescription: args.ending.shortDescription,
      dominantLabels: args.ending.dominantLabels,
      summaryStats: args.ending.summaryStats,
      introLines: args.ending.introLines,
      npcLine: args.ending.npcLine
    },
    storyDebug: {
      currentWeek: args.hud.week,
      weeks: args.storyWeeks
    }
  };
}
