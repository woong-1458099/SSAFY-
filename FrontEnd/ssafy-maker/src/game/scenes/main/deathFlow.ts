import type Phaser from "phaser";
import type { RecordDeathRequest } from "../../../features/death/deathApi";
import { resolveEnding } from "../../../features/progression/services/endingResolver";
import type { EndingFlowPayload } from "../../../features/progression/types/ending";

export const MAIN_SCENE_DEATH_FLOW_CONFIG = {
  overlay: {
    durationMs: 2000,
    title: "WASTED",
    subtitle: "HP가 모두 소진되었습니다."
  },
  record: {
    cause: "HP_ZERO"
  }
} as const;

export function shouldTriggerMainSceneDeathSequence(
  hp: number,
  options: { initialized: boolean; deathSequenceActive: boolean }
): boolean {
  return options.initialized && !options.deathSequenceActive && hp <= 0;
}

export function shouldDeferImmediateEndingDuringDeathSequence(
  payload: EndingFlowPayload,
  deathSequenceActive: boolean
): boolean {
  return deathSequenceActive && resolveEnding(payload).endingId === "game_over";
}

export function buildMainSceneDeathOverlayPayload(): { title: string; subtitle: string } {
  return {
    title: MAIN_SCENE_DEATH_FLOW_CONFIG.overlay.title,
    subtitle: MAIN_SCENE_DEATH_FLOW_CONFIG.overlay.subtitle
  };
}

export function buildMainSceneDeathRecordRequest(input: {
  areaId?: string;
  sceneId?: string;
}): RecordDeathRequest {
  return {
    areaId: input.areaId,
    sceneId: input.sceneId,
    cause: MAIN_SCENE_DEATH_FLOW_CONFIG.record.cause
  };
}

export function scheduleMainSceneDeathEndingTransition(args: {
  scene: Phaser.Scene;
  onComplete: () => void;
}): Phaser.Time.TimerEvent {
  return args.scene.time.delayedCall(MAIN_SCENE_DEATH_FLOW_CONFIG.overlay.durationMs, () => {
    if (!args.scene.sys.isActive()) {
      return;
    }

    args.onComplete();
  });
}
