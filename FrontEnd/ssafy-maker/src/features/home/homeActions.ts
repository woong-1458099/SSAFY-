export type HomeActionId = "sleep" | "study" | "game";
export type HomeActionStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";

export type HomeActionResolution = {
  hpDelta: number;
  stressDelta: number;
  statDelta: Partial<Record<HomeActionStatKey, number>>;
  toastMessage: string;
};

export const HOME_ACTION_LABELS: Record<HomeActionId, string> = {
  sleep: "잠자기 (행동력 1)  -  스트레스 감소, 체력 회복",
  study: "공부하기 (행동력 1)  -  FE/BE 증가, 스트레스/체력 변화",
  game: "게임하기 (행동력 1)  -  FE/BE 소폭 감소, 스트레스 감소",
};

export function resolveHomeAction(action: HomeActionId): HomeActionResolution {
  switch (action) {
    case "sleep":
      return {
        hpDelta: 22,
        stressDelta: -20,
        statDelta: {},
        toastMessage: "잠자기 완료",
      };
    case "study":
      return {
        hpDelta: -12,
        stressDelta: 10,
        statDelta: { fe: 4, be: 4 },
        toastMessage: "공부하기 완료",
      };
    case "game":
      return {
        hpDelta: -6,
        stressDelta: -12,
        statDelta: { fe: -2, be: -2 },
        toastMessage: "게임하기 완료",
      };
  }
}
