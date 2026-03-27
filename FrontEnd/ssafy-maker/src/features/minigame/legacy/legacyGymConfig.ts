export const LEGACY_GYM_EXERCISES = [
  { name: "BENCH PRESS", emoji: "🏋️" },
  { name: "SQUAT", emoji: "🦵" },
  { name: "DEADLIFT", emoji: "💪" },
  { name: "SHOULDER PRESS", emoji: "🏋️" },
];

export const LEGACY_GYM_MAX_REPS = 10;
export const LEGACY_GYM_TOTAL_TIME = 40;

const LEGACY_GYM_RESULT_RULES: Array<{
  minReps: number;
  minPerfectRate?: number;
  grade: "S" | "A" | "B" | "C" | "D";
  gradeColor: string;
  message: string;
  reward: string;
}> = [
  { minReps: LEGACY_GYM_MAX_REPS, minPerfectRate: 0.7, grade: "S", gradeColor: "#ffd700", message: "🏆 완벽한 퍼포먼스!", reward: "HPMAX +6" },
  { minReps: LEGACY_GYM_MAX_REPS, grade: "A", gradeColor: "#44ff88", message: "💪 훌륭해요!", reward: "HPMAX +4" },
  { minReps: 7, grade: "B", gradeColor: "#4499ff", message: "👍 좋아요!", reward: "HPMAX +3" },
  { minReps: 4, grade: "C", gradeColor: "#ffaa44", message: "😤 더 노력해봐요", reward: "HPMAX +2" },
  { minReps: 0, grade: "D", gradeColor: "#ff4466", message: "😢 다음에 다시...", reward: "HPMAX +1" },
];

export function resolveLegacyGymResult(reps: number, perfectCount: number) {
  const perfectRate = reps > 0 ? perfectCount / reps : 0;
  return (
    LEGACY_GYM_RESULT_RULES.find((rule) => reps >= rule.minReps && (rule.minPerfectRate === undefined || perfectRate >= rule.minPerfectRate)) ??
    LEGACY_GYM_RESULT_RULES[LEGACY_GYM_RESULT_RULES.length - 1]
  );
}
