export type EndingId =
  | "lotto"
  | "game_over"
  | "runaway"
  | "largecompany"
  | "lucky_job"
  | "gamer"
  | "frontend_master"
  | "backend_master"
  | "collaborative_dev"
  | "leader_type"
  | "health_trainer"
  | "normal";

export type EndingSummaryStatKey =
  | "fe"
  | "be"
  | "teamwork"
  | "luck"
  | "hp"
  | "hpMax"
  | "stress"
  | "gamePlayCount";

export type EndingSummaryStat = {
  key: EndingSummaryStatKey;
  label: string;
  value: number;
};

export type EndingComicPanel = {
  id: string;
  title: string;
  body: string;
  accentColor: number;
};

export type EndingImageAsset = {
  key: string;
  path: string;
  label: string;
};

export type EndingResult = {
  endingId: EndingId;
  title: string;
  priority: number;
  triggerMode: "manual" | "immediate";
  presentationMode: "full" | "summaryOnly";
  shortDescription: string;
  summaryStats: EndingSummaryStat[];
  introLines: string[];
  npcLine: string;
  comicPanels: EndingComicPanel[];
  dominantLabels: string[];
  previewImage?: EndingImageAsset;
  introImage?: EndingImageAsset;
  comicImages: EndingImageAsset[];
};

export type EndingFlowPayload = {
  fe: number;
  be: number;
  teamwork: number;
  luck: number;
  hp: number;
  hpMax: number;
  stress: number;
  gamePlayCount: number;
  lottoRank: number | null;
  week: number;
  dayLabel: string;
  timeLabel: string;
};
