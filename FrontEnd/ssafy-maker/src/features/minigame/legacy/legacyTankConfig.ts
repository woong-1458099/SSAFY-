export const LEGACY_TANK_INITIAL_LIVES = 3;
export const LEGACY_TANK_SHOOT_COOLDOWN_MS = 400;
export const LEGACY_TANK_INITIAL_PLAYER_AIM_ANGLE = -Math.PI / 2;

export const LEGACY_TANK_ENDINGS = {
  victory: {
    title: "🏆 VICTORY!",
    subtitle: "적 탱크를 격파했습니다!",
    reward: "FE +5, GP +20",
    titleColor: "#88ff00",
    rewardColor: "#FFD700"
  },
  defeat: {
    title: "💥 DEFEAT",
    subtitle: "탱크가 파괴되었습니다...",
    reward: "FE +1, STRESS +3",
    titleColor: "#ff4466",
    rewardColor: "#ffaa00"
  }
} as const;
