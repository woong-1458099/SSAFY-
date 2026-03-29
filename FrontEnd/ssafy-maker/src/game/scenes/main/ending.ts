import type { EndingFlowPayload, EndingId } from "../../../features/progression/types/ending";

export function buildMainSceneEndingPresetPayload(
  endingId: EndingId,
  fallbackBuilder: () => EndingFlowPayload
): EndingFlowPayload {
  const base: Pick<EndingFlowPayload, "week" | "dayLabel" | "timeLabel" | "hpMax" | "stress" | "gamePlayCount" | "lottoRank"> = {
    week: 6,
    hpMax: 100,
    stress: 24,
    gamePlayCount: 0,
    lottoRank: null,
    dayLabel: "금요일",
    timeLabel: "밤"
  };

  switch (endingId) {
    case "lotto":
      return { ...base, fe: 30, be: 24, teamwork: 28, luck: 200, hp: 84, lottoRank: 1 };
    case "game_over":
      return { ...base, fe: 90, be: 84, teamwork: 72, luck: 40, hp: 0, stress: 92 };
    case "runaway":
      return { ...base, fe: 110, be: 106, teamwork: 104, luck: 52, hp: 38, stress: 100 };
    case "largecompany":
      return { ...base, fe: 180, be: 170, teamwork: 165, luck: 58, hp: 72 };
    case "lucky_job":
      return { ...base, fe: 88, be: 74, teamwork: 80, luck: 190, hp: 70 };
    case "gamer":
      return { ...base, fe: 70, be: 52, teamwork: 64, luck: 162, hp: 76, gamePlayCount: 18 };
    case "frontend_master":
      return { ...base, fe: 260, be: 92, teamwork: 118, luck: 46, hp: 68 };
    case "backend_master":
      return { ...base, fe: 82, be: 220, teamwork: 94, luck: 42, hp: 66 };
    case "collaborative_dev":
      return { ...base, fe: 170, be: 160, teamwork: 220, luck: 44, hp: 82 };
    case "leader_type":
      return { ...base, fe: 120, be: 118, teamwork: 260, luck: 40, hp: 88 };
    case "health_trainer":
      return { ...base, fe: 70, be: 68, teamwork: 108, luck: 34, hp: 96, hpMax: 210 };
    case "normal":
      return { ...base, fe: 118, be: 112, teamwork: 124, luck: 78, hp: 74 };
    default:
      return fallbackBuilder();
  }
}
