import Phaser from "phaser";
import {
  MINIGAME_COMPLETION_EVENT,
  MINIGAME_REWARD_EVENT,
  parseMinigameRewardText,
  type MinigameCompletionPayload,
  type MinigameRewardPayload
} from "../../features/minigame/minigameRewardEvents";
import type { HudState, PlayerStatKey } from "../state/gameState";

type MinigameRewardManagerOptions = {
  scene: Phaser.Scene;
  getHudState: () => HudState;
  patchHudState: (next: Partial<HudState>) => void;
  applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  unlockMinigame?: (sceneKey: string) => void;
};

export class MinigameRewardManager {
  private readonly scene: Phaser.Scene;
  private readonly getHudState: () => HudState;
  private readonly patchHudState: (next: Partial<HudState>) => void;
  private readonly applyStatDelta: (delta: Partial<Record<PlayerStatKey, number>>, multiplier?: 1 | -1) => void;
  private readonly unlockMinigame?: (sceneKey: string) => void;

  constructor(options: MinigameRewardManagerOptions) {
    this.scene = options.scene;
    this.getHudState = options.getHudState;
    this.patchHudState = options.patchHudState;
    this.applyStatDelta = options.applyStatDelta;
    this.unlockMinigame = options.unlockMinigame;
    this.scene.game.events.on(MINIGAME_REWARD_EVENT, this.handleReward, this);
    this.scene.game.events.on(MINIGAME_COMPLETION_EVENT, this.handleCompletion, this);
  }

  destroy(): void {
    this.scene.game.events.off(MINIGAME_REWARD_EVENT, this.handleReward, this);
    this.scene.game.events.off(MINIGAME_COMPLETION_EVENT, this.handleCompletion, this);
  }

  private handleReward(payload: MinigameRewardPayload): void {
    const parsed = parseMinigameRewardText(payload.rewardText);
    const hudState = this.getHudState();
    const hudPatch: Partial<HudState> = {};

    this.applyStatDelta(parsed.statDelta);
    if (typeof parsed.hudDelta.hp === "number" && parsed.hudDelta.hp !== 0) {
      hudPatch.hp = hudState.hp + parsed.hudDelta.hp;
    }
    if (typeof parsed.hudDelta.hpMax === "number" && parsed.hudDelta.hpMax !== 0) {
      hudPatch.hpMax = hudState.hpMax + parsed.hudDelta.hpMax;
    }
    if (typeof parsed.hudDelta.money === "number" && parsed.hudDelta.money !== 0) {
      hudPatch.money = hudState.money + parsed.hudDelta.money;
    }
    if (typeof parsed.hudDelta.stress === "number" && parsed.hudDelta.stress !== 0) {
      hudPatch.stress = hudState.stress + parsed.hudDelta.stress;
    }
    if (Object.keys(hudPatch).length > 0) {
      this.patchHudState(hudPatch);
    }
  }

  private handleCompletion(payload: MinigameCompletionPayload): void {
    this.unlockMinigame?.(payload.sceneKey);
  }
}
