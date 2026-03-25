import Phaser from "phaser";

export type PlayerStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";

export type HudState = {
  timeLabel: string;
  locationLabel: string;
  week: number;
  dayLabel: string;
  actionPoint: number;
  maxActionPoint: number;
  hp: number;
  hpMax: number;
  money: number;
  stress: number;
};

export type PlayerStatsState = Record<PlayerStatKey, number>;

export type RuntimeGameState = {
  hud: HudState;
  stats: PlayerStatsState;
  affection: Record<string, number>;
  flags: string[];
};

export const DEFAULT_HUD_STATE: HudState = {
  timeLabel: "오전",
  locationLabel: "전체 지도",
  week: 1,
  dayLabel: "월요일",
  actionPoint: 4,
  maxActionPoint: 4,
  hp: 82,
  hpMax: 100,
  money: 50000,
  stress: 20,
};

export const DEFAULT_STATS_STATE: PlayerStatsState = {
  fe: 20,
  be: 20,
  teamwork: 40,
  luck: 10,
  stress: 20,
};

export function createDefaultGameState(): RuntimeGameState {
  return {
    hud: { ...DEFAULT_HUD_STATE },
    stats: { ...DEFAULT_STATS_STATE },
    affection: {},
    flags: []
  };
}

export function cloneGameState(state: RuntimeGameState): RuntimeGameState {
  return {
    hud: { ...state.hud },
    stats: { ...state.stats },
    affection: { ...(state.affection || {}) },
    flags: [...(state.flags || [])]
  };
}

export function clampHudState(hud: HudState): HudState {
  const hpMax = Math.max(1, Math.round(hud.hpMax));
  const maxActionPoint = Math.max(0, Math.round(hud.maxActionPoint));
  return {
    ...hud,
    week: Math.max(1, Math.round(hud.week)),
    maxActionPoint,
    actionPoint: Phaser.Math.Clamp(Math.round(hud.actionPoint), 0, maxActionPoint),
    hpMax,
    hp: Phaser.Math.Clamp(Math.round(hud.hp), 0, hpMax),
    money: Math.max(0, Math.round(hud.money)),
    stress: Phaser.Math.Clamp(Math.round(hud.stress), 0, 100)
  };
}

export function clampStatsState(stats: PlayerStatsState): PlayerStatsState {
  return {
    fe: Phaser.Math.Clamp(Math.round(stats.fe), 0, 150),
    be: Phaser.Math.Clamp(Math.round(stats.be), 0, 150),
    teamwork: Phaser.Math.Clamp(Math.round(stats.teamwork), 0, 150),
    luck: Phaser.Math.Clamp(Math.round(stats.luck), 0, 150),
    stress: Phaser.Math.Clamp(Math.round(stats.stress), 0, 100),
  };
}
