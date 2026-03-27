export const LEGACY_TYPING_WORDS = [
  "API", "CSS", "DOM", "Git", "npm", "SQL", "JWT", "AWS",
  "React", "Redux", "Spring", "Docker", "Linux", "MySQL", "Vue.js", "axios",
  "async", "await", "fetch", "props", "state", "hooks", "query", "merge",
  "useState", "useEffect", "component", "function", "variable", "callback",
  "promise", "database", "frontend", "backend", "fullstack", "deploy",
  "container", "kubernetes", "microservice", "algorithm"
] as const;

export const LEGACY_TYPING_INITIAL_LIVES = 5;
export const LEGACY_TYPING_INITIAL_WORD_SPEED = 0.8;
export const LEGACY_TYPING_INITIAL_SPAWN_INTERVAL_MS = 2000;
export const LEGACY_TYPING_MIN_SPAWN_INTERVAL_MS = 800;

const LEGACY_TYPING_RESULT_RULES = [
  { minScore: 500, grade: "S", gradeColor: "#FFD700", message: "🏆 타이핑 마스터!", reward: "BE +7" },
  { minScore: 350, grade: "A", gradeColor: "#44ff88", message: "⚡ 훌륭해요!", reward: "BE +5" },
  { minScore: 200, grade: "B", gradeColor: "#4499ff", message: "👍 좋아요!", reward: "BE +3" },
  { minScore: 80, grade: "C", gradeColor: "#ff8844", message: "💪 연습이 필요해요", reward: "BE +1" },
  { minScore: 0, grade: "D", gradeColor: "#ff4466", message: "📚 다시 연습해보세요", reward: "STRESS +4" },
] as const;

export function resolveLegacyTypingResult(score: number) {
  return LEGACY_TYPING_RESULT_RULES.find((rule) => score >= rule.minScore) ?? LEGACY_TYPING_RESULT_RULES[LEGACY_TYPING_RESULT_RULES.length - 1];
}
