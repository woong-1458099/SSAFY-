export const LEGACY_TANK_INITIAL_LIVES = 3;
export const LEGACY_TANK_SHOOT_COOLDOWN_MS = 400;
export const LEGACY_TANK_INITIAL_PLAYER_AIM_ANGLE = -Math.PI / 2;

export function resolveLegacyTankEnding(playerWon: boolean, playerLives: number) {
  if (!playerWon) {
    return {
      title: "💥 DEFEAT",
      subtitle: "탱크가 파괴되었습니다...",
      reward: "FE +1, STRESS +4",
      titleColor: "#ff4466",
      rewardColor: "#ffaa00"
    } as const;
  }

  if (playerLives >= 3) {
    return {
      title: "🏆 VICTORY!",
      subtitle: "적 탱크를 격파했습니다!",
      reward: "FE +7, TEAMWORK +5",
      titleColor: "#88ff00",
      rewardColor: "#FFD700"
    } as const;
  }

  if (playerLives === 2) {
    return {
      title: "🏆 VICTORY!",
      subtitle: "적 탱크를 격파했습니다!",
      reward: "FE +5, TEAMWORK +4",
      titleColor: "#88ff00",
      rewardColor: "#FFD700"
    } as const;
  }

  return {
    title: "🏆 VICTORY!",
    subtitle: "적 탱크를 격파했습니다!",
    reward: "FE +3, TEAMWORK +3",
    titleColor: "#88ff00",
    rewardColor: "#FFD700"
  } as const;
}
