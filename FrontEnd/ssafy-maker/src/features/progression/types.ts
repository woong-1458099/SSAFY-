export type PlayerStats = {
  health: number;
  coding: number;
  presentation: number;
  teamwork: number;
  luck: number;
  stress: number;
};

export type ProgressState = {
  day: number;
  week: number;
  endingFlag?: string;
  stats: PlayerStats;
};

