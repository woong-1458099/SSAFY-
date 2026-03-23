export const LOTTO_COMPLETED_EVENT = "minigame:lotto-completed";

export type LottoPrizeTier = "none" | "fifth" | "fourth" | "third" | "second" | "first";

export type LottoOutcome = {
  tier: LottoPrizeTier;
  title: string;
  rewardText: string;
  rewardMoney: number;
  isJackpot: boolean;
  color: string;
  celebration: "none" | "small" | "big";
  matchCount: number;
  bonusMatch: boolean;
};

type LottoOutcomeTableEntry = LottoOutcome & {
  chance: number;
};

const LOTTO_OUTCOME_TABLE: LottoOutcomeTableEntry[] = [
  { tier: "none", title: "냙첨이에요...", rewardText: "0GP", rewardMoney: 0, isJackpot: false, color: "#888888", celebration: "none", matchCount: 0, bonusMatch: false, chance: 0.93 },
  { tier: "fifth", title: "5등 당첨!", rewardText: "GP +25,000", rewardMoney: 25000, isJackpot: false, color: "#aaffaa", celebration: "small", matchCount: 3, bonusMatch: false, chance: 0.06 },
  { tier: "fourth", title: "4등 당첨!", rewardText: "GP +170,000", rewardMoney: 170000, isJackpot: false, color: "#88ccff", celebration: "small", matchCount: 4, bonusMatch: false, chance: 0.008 },
  { tier: "third", title: "3등 당첨!", rewardText: "GP +850,000", rewardMoney: 850000, isJackpot: false, color: "#88ff88", celebration: "small", matchCount: 5, bonusMatch: false, chance: 0.0015 },
  { tier: "second", title: "2등 당첨!!", rewardText: "GP +8,500,000", rewardMoney: 8500000, isJackpot: false, color: "#ff88ff", celebration: "big", matchCount: 5, bonusMatch: true, chance: 0.0004 },
  { tier: "first", title: "1등 당첨!!!", rewardText: "로또 엔딩", rewardMoney: 0, isJackpot: true, color: "#ffd700", celebration: "big", matchCount: 6, bonusMatch: false, chance: 0.0001 },
];

export function rollLottoOutcome(randomValue = Math.random()): LottoOutcome {
  let cumulative = 0;

  for (const entry of LOTTO_OUTCOME_TABLE) {
    cumulative += entry.chance;
    if (randomValue < cumulative) {
      return {
        tier: entry.tier,
        title: entry.title,
        rewardText: entry.rewardText,
        rewardMoney: entry.rewardMoney,
        isJackpot: entry.isJackpot,
        color: entry.color,
        celebration: entry.celebration,
        matchCount: entry.matchCount,
        bonusMatch: entry.bonusMatch,
      };
    }
  }

  const fallback = LOTTO_OUTCOME_TABLE[LOTTO_OUTCOME_TABLE.length - 1];
  return {
    tier: fallback.tier,
    title: fallback.title,
    rewardText: fallback.rewardText,
    rewardMoney: fallback.rewardMoney,
    isJackpot: fallback.isJackpot,
    color: fallback.color,
    celebration: fallback.celebration,
    matchCount: fallback.matchCount,
    bonusMatch: fallback.bonusMatch,
  };
}
