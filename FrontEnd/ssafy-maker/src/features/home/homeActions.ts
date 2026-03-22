import type { PlayerStatKey } from "../../game/state/gameState";

export type HomeActionId = "sleep" | "study" | "game";

export type HomeActionResolution = {
  hpDelta: number;
  stressDelta: number;
  statDelta: Partial<Record<PlayerStatKey, number>>;
  toastMessage: string;
};

export const HOME_ACTION_LABELS: Record<HomeActionId, string> = {
  sleep: "잠자기 - 체력 회복 / 스트레스 감소",
  study: "공부하기 - FE/BE 증가 / 체력 감소",
  game: "게임하기 - 스트레스 감소 / 운 증가"
};

export function resolveHomeAction(action: HomeActionId): HomeActionResolution {
  switch (action) {
    case "sleep":
      return {
        hpDelta: 22,
        stressDelta: -20,
        statDelta: {},
        toastMessage: "잠자기 완료"
      };
    case "study":
      return {
        hpDelta: -12,
        stressDelta: 10,
        statDelta: { fe: 4, be: 4 },
        toastMessage: "공부하기 완료"
      };
    case "game":
      return {
        hpDelta: -4,
        stressDelta: -14,
        statDelta: { luck: 1 },
        toastMessage: "게임하기 완료"
      };
  }
}
