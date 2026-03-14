export type EndingId =
  | "frontend-developer"
  | "backend-developer"
  | "team-player"
  | "stamina-survivor"
  | "lucky-break"
  | "frontend-leader";

export type EndingSummaryStatKey = "fe" | "be" | "teamwork" | "hp" | "luck";

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

export type EndingResult = {
  endingId: EndingId;
  title: string;
  shortDescription: string;
  summaryStats: EndingSummaryStat[];
  introLines: string[];
  npcLine: string;
  comicPanels: EndingComicPanel[];
  dominantLabels: string[];
};

export type EndingFlowPayload = {
  fe: number;
  be: number;
  teamwork: number;
  luck: number;
  hp: number;
  week: number;
  dayLabel: string;
  timeLabel: string;
};
