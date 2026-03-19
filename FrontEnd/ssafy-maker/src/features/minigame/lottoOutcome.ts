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
  { tier: "none", title: "\uB0D9\uCCA8\uC774\uC5D0\uC694...", rewardText: "0GP", rewardMoney: 0, isJackpot: false, color: "#888888", celebration: "none", matchCount: 0, bonusMatch: false, chance: 0.93 },
  { tier: "fifth", title: "5\uB4F1 \uB2F9\uCCA8!", rewardText: "GP +25,000", rewardMoney: 25000, isJackpot: false, color: "#aaffaa", celebration: "small", matchCount: 3, bonusMatch: false, chance: 0.06 },
  { tier: "fourth", title: "4\uB4F1 \uB2F9\uCCA8!", rewardText: "GP +170,000", rewardMoney: 170000, isJackpot: false, color: "#88ccff", celebration: "small", matchCount: 4, bonusMatch: false, chance: 0.008 },
  { tier: "third", title: "3\uB4F1 \uB2F9\uCCA8!", rewardText: "GP +850,000", rewardMoney: 850000, isJackpot: false, color: "#88ff88", celebration: "small", matchCount: 5, bonusMatch: false, chance: 0.0015 },
  { tier: "second", title: "2\uB4F1 \uB2F9\uCCA8!!", rewardText: "GP +8,500,000", rewardMoney: 8500000, isJackpot: false, color: "#ff88ff", celebration: "big", matchCount: 5, bonusMatch: true, chance: 0.0004 },
  { tier: "first", title: "1\uB4F1 \uB2F9\uCCA8!!!", rewardText: "\uB85C\uB610 \uC5D4\uB529", rewardMoney: 0, isJackpot: true, color: "#ffd700", celebration: "big", matchCount: 6, bonusMatch: false, chance: 0.0001 },
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
