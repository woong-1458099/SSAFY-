import Phaser from "phaser";

export const LEGACY_RUNNER_COUNTDOWN_DELAY_MS = 700;
export const LEGACY_RUNNER_INITIAL_SPEED = 300;
export const LEGACY_RUNNER_INITIAL_OBSTACLE_DELAY_MS = 2200;
export const LEGACY_RUNNER_MIN_OBSTACLE_DELAY_MS = 1200;

export const LEGACY_RUNNER_OBSTACLES = [
  {
    type: 0,
    width: 28,
    height: 40,
    yOffset: -20,
    build(scene: Phaser.Scene) {
      return [
        scene.add.rectangle(0, 0, 28, 40, 0xff4466).setStrokeStyle(3, 0xff88aa),
        scene.add.rectangle(0, -24, 36, 12, 0xff2244).setStrokeStyle(2, 0xff88aa),
        scene.add.rectangle(6, -4, 6, 6, 0xffff00)
      ];
    }
  },
  {
    type: 1,
    width: 24,
    height: 80,
    yOffset: -40,
    build(scene: Phaser.Scene) {
      return [
        scene.add.rectangle(0, 0, 24, 80, 0xffaa00).setStrokeStyle(3, 0xffdd44),
        scene.add.rectangle(0, -44, 32, 14, 0xff8800).setStrokeStyle(2, 0xffdd44)
      ];
    }
  },
  {
    type: 2,
    width: 44,
    height: 24,
    yOffset: -120,
    build(scene: Phaser.Scene) {
      return [
        scene.add.rectangle(0, 0, 44, 24, 0x44ff88).setStrokeStyle(3, 0x88ffaa),
        scene.add.rectangle(-20, -10, 20, 10, 0x22cc66),
        scene.add.rectangle(20, -10, 20, 10, 0x22cc66)
      ];
    }
  }
] as const;

const LEGACY_RUNNER_RESULT_RULES = [
  { minScore: 3000, grade: "S", gradeColor: "#FFD700", reward: "LUCK +5, GP +15" },
  { minScore: 1500, grade: "A", gradeColor: "#00ff88", reward: "LUCK +3, GP +10" },
  { minScore: 800, grade: "B", gradeColor: "#4499ff", reward: "LUCK +2, GP +5" },
  { minScore: 0, grade: "C", gradeColor: "#ff4466", reward: "LUCK +1, GP +3" },
] as const;

export function resolveLegacyRunnerResult(finalScore: number) {
  return LEGACY_RUNNER_RESULT_RULES.find((rule) => finalScore >= rule.minScore) ?? LEGACY_RUNNER_RESULT_RULES[LEGACY_RUNNER_RESULT_RULES.length - 1];
}
