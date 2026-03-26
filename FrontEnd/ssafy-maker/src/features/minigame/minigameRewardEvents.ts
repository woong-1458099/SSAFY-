import type Phaser from "phaser";
import type { PlayerStatKey } from "../../game/state/gameState";

export const MINIGAME_REWARD_EVENT = "minigame:reward";
export const MINIGAME_COMPLETION_EVENT = "minigame:completion";

export type MinigameRewardPayload = {
  sceneKey: string;
  rewardText: string;
};

export type MinigameCompletionPayload = {
  sceneKey: string;
};

export type ParsedMinigameReward = {
  hudDelta: {
    hp?: number;
    hpMax?: number;
    money?: number;
    stress?: number;
  };
  statDelta: Partial<Record<PlayerStatKey, number>>;
};

const STAT_LABEL_TO_KEY: Record<string, PlayerStatKey> = {
  FE: "fe",
  BE: "be",
  LUCK: "luck",
  TEAMWORK: "teamwork",
  협업: "teamwork",
  운: "luck"
};

export function emitMinigameReward(scene: Phaser.Scene, payload: MinigameRewardPayload): void {
  scene.game.events.emit(MINIGAME_REWARD_EVENT, payload);
  scene.game.events.emit(MINIGAME_COMPLETION_EVENT, { sceneKey: payload.sceneKey } satisfies MinigameCompletionPayload);
}

export function emitMinigameCompletion(scene: Phaser.Scene, payload: MinigameCompletionPayload): void {
  scene.game.events.emit(MINIGAME_COMPLETION_EVENT, payload);
}

export function parseMinigameRewardText(rewardText: string): ParsedMinigameReward {
  const hudDelta: ParsedMinigameReward["hudDelta"] = {};
  const statDelta: ParsedMinigameReward["statDelta"] = {};
  const normalized = rewardText.replace(/보상:\s*/g, "").replace(/,/g, " ");
  const regex = /([A-Za-z가-힣]+)\s*([+-])\s*([\d,]+)/g;

  for (const match of normalized.matchAll(regex)) {
    const rawLabel = match[1]?.trim() ?? "";
    const sign = match[2] === "-" ? -1 : 1;
    const amount = Number((match[3] ?? "0").replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount === 0) {
      continue;
    }

    const delta = sign * amount;
    const upperLabel = rawLabel.toUpperCase();

    if (upperLabel === "GP" || rawLabel === "골드" || rawLabel === "G") {
      hudDelta.money = (hudDelta.money ?? 0) + delta;
      continue;
    }

    if (upperLabel === "HP") {
      hudDelta.hp = (hudDelta.hp ?? 0) + delta;
      continue;
    }

    if (upperLabel === "HPMAX") {
      hudDelta.hpMax = (hudDelta.hpMax ?? 0) + delta;
      continue;
    }

    if (upperLabel === "STRESS" || rawLabel === "스트레스") {
      hudDelta.stress = (hudDelta.stress ?? 0) + delta;
      continue;
    }

    if (upperLabel === "MENTAL" || rawLabel === "멘탈") {
      hudDelta.stress = (hudDelta.stress ?? 0) - delta;
      continue;
    }

    const mappedKey = STAT_LABEL_TO_KEY[rawLabel] ?? STAT_LABEL_TO_KEY[upperLabel];
    if (!mappedKey) {
      continue;
    }

    statDelta[mappedKey] = (statDelta[mappedKey] ?? 0) + delta;
  }

  return { hudDelta, statDelta };
}
