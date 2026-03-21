import type { GameHud } from "../../features/ui/components/GameHud";
import {
  clampHudState,
  clampStatsState,
  cloneGameState,
  createDefaultGameState,
  type HudState,
  type PlayerStatsState,
  type PlayerStatKey,
  type RuntimeGameState
} from "../state/gameState";

export class StatSystemManager {
  private state: RuntimeGameState;
  private hud?: GameHud;
  private onStatsChanged?: (stats: PlayerStatsState) => void;

  constructor(initialState: RuntimeGameState = createDefaultGameState()) {
    this.state = cloneGameState(initialState);
  }

  attachHud(hud: GameHud): void {
    this.hud = hud;
    this.hud.applyState(this.state.hud);
  }

  setStatsChangedListener(listener?: (stats: PlayerStatsState) => void): void {
    this.onStatsChanged = listener;
  }

  getState(): RuntimeGameState {
    return cloneGameState(this.state);
  }

  getHudState(): HudState {
    return { ...this.state.hud };
  }

  getStatsState(): PlayerStatsState {
    return { ...this.state.stats };
  }

  reset(): void {
    this.state = createDefaultGameState();
    this.emitChanges(true);
  }

  restore(nextState: RuntimeGameState): void {
    this.state = {
      hud: clampHudState({ ...nextState.hud }),
      stats: clampStatsState({ ...nextState.stats })
    };

    if (this.state.hud.stress !== this.state.stats.stress) {
      this.state.hud = clampHudState({
        ...this.state.hud,
        stress: this.state.stats.stress
      });
    }

    this.emitChanges(true);
  }

  patchHudState(next: Partial<HudState>): void {
    this.state.hud = clampHudState({ ...this.state.hud, ...next });
    let statsChanged = false;

    if (typeof next.stress === "number" && this.state.stats.stress !== this.state.hud.stress) {
      this.state.stats = clampStatsState({
        ...this.state.stats,
        stress: this.state.hud.stress
      });
      statsChanged = true;
    }

    this.emitChanges(statsChanged);
  }

  applyStatDelta(delta: Partial<Record<PlayerStatKey, number>>, multiplier: 1 | -1 = 1): void {
    const nextStats: PlayerStatsState = { ...this.state.stats };
    let statsChanged = false;

    (Object.keys(delta) as PlayerStatKey[]).forEach((key) => {
      const value = delta[key];
      if (typeof value !== "number" || value === 0) {
        return;
      }

      nextStats[key] = nextStats[key] + value * multiplier;
      statsChanged = true;
    });

    if (!statsChanged) {
      return;
    }

    this.state.stats = clampStatsState(nextStats);
    if (this.state.hud.stress !== this.state.stats.stress) {
      this.state.hud = clampHudState({
        ...this.state.hud,
        stress: this.state.stats.stress
      });
    }
    this.emitChanges(true);
  }

  private emitChanges(statsChanged: boolean): void {
    this.hud?.applyState(this.state.hud);
    if (statsChanged) {
      this.onStatsChanged?.({ ...this.state.stats });
    }
  }
}
