import type Phaser from "phaser";
import type { PlayerStatKey } from "../../game/state/gameState";

export const MINIGAME_REWARD_EVENT = "minigame:reward";

export type MinigameRewardPayload = {
  sceneKey: string;
  rewardText: string;
};

export type ParsedMinigameReward = {
  hudDelta: {
    hp?: number;
    money?: number;
    stress?: number;
  };
  statDelta: Partial<Record<PlayerStatKey, number>>;
};

const STAT_LABEL_TO_KEY: Record<string, PlayerStatKey> = {
  FE: "fe",
  "집중": "fe",
  BE: "be",
  INT: "be",
  "지능": "be",
  "협업": "teamwork",
  "매력": "teamwork",
  LUCK: "luck",
  AGI: "luck",
  "민첩": "luck",
  "운": "luck",
  "요리": "luck",
  STRESS: "stress",
  "스트레스": "stress"
};

export function emitMinigameReward(scene: Phaser.Scene, payload: MinigameRewardPayload): void {
  scene.game.events.emit(MINIGAME_REWARD_EVENT, payload);
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

    if (upperLabel === "HP" || rawLabel === "체력") {
      hudDelta.hp = (hudDelta.hp ?? 0) + delta;
      continue;
    }

    if (upperLabel === "STRESS" || rawLabel === "스트레스") {
      hudDelta.stress = (hudDelta.stress ?? 0) + delta;
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
