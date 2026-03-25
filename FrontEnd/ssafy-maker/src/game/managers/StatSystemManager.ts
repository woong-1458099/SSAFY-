import { normalizeAffectionNpcId } from "../../common/enums/npc";
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

export interface HudProxy {
  applyState(state: Partial<HudState>): void;
}

export class StatSystemManager {
  private state: RuntimeGameState;
  private hud?: HudProxy;
  private onStatsChanged?: (stats: PlayerStatsState) => void;

  constructor(initialState: RuntimeGameState = createDefaultGameState()) {
    this.state = cloneGameState(initialState);
    this.state.affection = this.normalizeAffectionState(this.state.affection);
  }

  attachHud(hud: HudProxy): void {
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

  getAffection(npcId: string): number {
    const normalizedNpcId = normalizeAffectionNpcId(npcId);
    if (!normalizedNpcId) {
      this.warnUnknownAffectionKey(npcId, "get");
      return 0;
    }

    return this.state.affection[normalizedNpcId] ?? 0;
  }

  applyAffectionDelta(changes: Record<string, number>): void {
    Object.entries(changes).forEach(([npcId, delta]) => {
      if (typeof delta !== "number" || !Number.isFinite(delta) || delta === 0) {
        return;
      }

      const normalizedNpcId = normalizeAffectionNpcId(npcId);
      if (!normalizedNpcId) {
        this.warnUnknownAffectionKey(npcId, "apply");
        return;
      }

      const current = this.state.affection[normalizedNpcId] ?? 0;
      this.state.affection[normalizedNpcId] = current + delta;
    });
  }

  addFlags(flags: string[]): void {
    const newFlags = flags.filter((f) => !this.state.flags.includes(f));
    if (newFlags.length > 0) {
      this.state.flags.push(...newFlags);
    }
  }

  hasFlag(flag: string): boolean {
    return this.state.flags.includes(flag);
  }

  reset(): void {
    this.state = createDefaultGameState();
    this.emitChanges(true);
  }

  restore(nextState: RuntimeGameState): void {
    this.state = {
      hud: clampHudState({ ...nextState.hud }),
      stats: clampStatsState({ ...nextState.stats }),
      affection: this.normalizeAffectionState(nextState.affection || {}),
      flags: [...(nextState.flags || [])]
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
    const oldHud = { ...this.state.hud };
    this.state.hud = clampHudState({ ...this.state.hud, ...next });
    let statsChanged = false;

    if (typeof next.stress === "number" && this.state.stats.stress !== this.state.hud.stress) {
      this.state.stats = clampStatsState({
        ...this.state.stats,
        stress: this.state.hud.stress
      });
      statsChanged = true;
    }

    // Only emit if something actually changed
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

  private normalizeAffectionState(affection: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};

    Object.entries(affection).forEach(([npcId, value]) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return;
      }

      const normalizedNpcId = normalizeAffectionNpcId(npcId);
      if (!normalizedNpcId) {
        this.warnUnknownAffectionKey(npcId, "restore");
        return;
      }

      normalized[normalizedNpcId] = (normalized[normalizedNpcId] ?? 0) + value;
    });

    return normalized;
  }

  private warnUnknownAffectionKey(npcId: string, source: "get" | "apply" | "restore"): void {
    console.warn(`[stats] Ignoring unknown affection key "${npcId}" during ${source}.`);
  }
}
