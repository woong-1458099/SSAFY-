export const LEGACY_RHYTHM_SONGS = [
  {
    title: "SSAFY RHYTHM",
    notes: [
      { key: "A", time: 1000 }, { key: "W", time: 1500 }, { key: "J", time: 2000 }, { key: "I", time: 2500 },
      { key: "A", time: 3000 }, { key: "J", time: 3500 }, { key: "W", time: 4000 }, { key: "I", time: 4500 },
      { key: "A", time: 5000 }, { key: "W", time: 5000 }, { key: "J", time: 5500 }, { key: "I", time: 6000 },
      { key: "A", time: 6500 }, { key: "W", time: 7000 }, { key: "J", time: 7500 }, { key: "I", time: 7500 },
      { key: "A", time: 8000 }, { key: "W", time: 8500 }, { key: "J", time: 9000 }, { key: "I", time: 9500 }
    ]
  }
] as const;

export const LEGACY_RHYTHM_LANES = [
  { key: "A", x: 200, color: 0xff4466, darkColor: 0x881133 },
  { key: "W", x: 310, color: 0xffaa00, darkColor: 0x886600 },
  { key: "J", x: 420, color: 0x44ff88, darkColor: 0x228844 },
  { key: "I", x: 530, color: 0x4499ff, darkColor: 0x224488 }
] as const;

export const LEGACY_RHYTHM_HIT_Y = 490;

export const LEGACY_RHYTHM_DIFFICULTY_SETTINGS = {
  Easy: { speed: 250, perfect: 60, good: 100, reward: "FE +3, GP +5" },
  Normal: { speed: 350, perfect: 50, good: 90, reward: "FE +4, GP +10" },
  Hard: { speed: 450, perfect: 40, good: 70, reward: "FE +5, GP +15" }
} as const;

export type LegacyRhythmDifficulty = keyof typeof LEGACY_RHYTHM_DIFFICULTY_SETTINGS;

export const LEGACY_RHYTHM_DIFFICULTIES = Object.keys(LEGACY_RHYTHM_DIFFICULTY_SETTINGS) as LegacyRhythmDifficulty[];

export function resolveLegacyRhythmResult(params: { perfect: number; good: number; miss: number }) {
  const { perfect, good, miss } = params;
  const total = perfect + good + miss;
  const accuracy = total > 0 ? (perfect + good * 0.5) / total : 0;

  if (accuracy >= 0.95) {
    return { grade: "S", gradeColor: "#FFD700" };
  }
  if (accuracy >= 0.8) {
    return { grade: "A", gradeColor: "#00ff88" };
  }
  if (accuracy >= 0.6) {
    return { grade: "B", gradeColor: "#4499ff" };
  }
  return { grade: "C", gradeColor: "#ff4466" };
}
