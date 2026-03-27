import type { DebugCommand } from "../../../debug/services/DebugCommandBus";
import { SCENE_IDS, type SceneId } from "../../scripts/scenes/sceneIds";

type MainSceneDebugCommandHandlers = {
  isDebugOverlayVisible: () => boolean;
  isDebugModeEnabled: () => boolean;
  applyDebugMode: (enabled: boolean) => void;
  toggleDebugPanel: () => void;
  toggleWorldTileEditor: () => void;
  toggleWorldGrid: () => void;
  toggleMinigameHud: () => void;
  teleportPlayerToWorld: (worldX: number, worldY: number) => void;
  restartWithDebugScene: (sceneId: SceneId) => void;
  adjustHudValue: (key: "hp" | "stress" | "money", delta: number) => void;
  adjustStatValue: (key: DebugCommand extends { type: "adjustStatValue"; key: infer K } ? K : never, delta: number) => void;
  advanceTime: () => void;
  adjustWeek: (delta: number) => void;
  adjustActionPoint: (delta: number) => void;
  refillActionPoint: () => void;
  giveInventoryItem: (templateId: string) => void;
  triggerCurrentFixedEvent: () => void;
  jumpToFixedEvent: (week: number, eventId: string, options: { resetCompletion: boolean; runImmediately: boolean }) => void;
  resetFixedEventCompletion: (eventId: string) => void;
  resetFixedEventCompletionsForWeek: (week: number) => void;
  saveAuto: () => void;
  startEndingFlow: () => void;
  startEndingFlowPreset: (endingId: DebugCommand extends { type: "startEndingFlowPreset"; endingId: infer K } ? K : never) => void;
};

export function handleMainSceneDebugCommand(
  command: DebugCommand,
  handlers: MainSceneDebugCommandHandlers
): void {
  switch (command.type) {
    case "toggleDebugOverlay": {
      const nextEnabled = handlers.isDebugOverlayVisible()
        ? false
        : !handlers.isDebugModeEnabled();
      handlers.applyDebugMode(nextEnabled);
      return;
    }
    case "toggleDebugPanel":
      handlers.toggleDebugPanel();
      return;
    case "toggleWorldTileEditor":
      handlers.toggleWorldTileEditor();
      return;
    case "toggleWorldGrid":
      handlers.toggleWorldGrid();
      return;
    case "toggleMinigameHud":
      if (handlers.isDebugOverlayVisible()) {
        handlers.toggleMinigameHud();
      }
      return;
    case "teleportPlayerToWorld":
      handlers.teleportPlayerToWorld(command.worldX, command.worldY);
      return;
    case "switchStartScene":
      handlers.restartWithDebugScene(command.sceneId);
      return;
    case "adjustHudValue":
      handlers.adjustHudValue(command.key, command.delta);
      return;
    case "adjustStatValue":
      handlers.adjustStatValue(command.key, command.delta);
      return;
    case "advanceTime":
      handlers.advanceTime();
      return;
    case "adjustWeek":
      handlers.adjustWeek(command.delta);
      return;
    case "adjustActionPoint":
      handlers.adjustActionPoint(command.delta);
      return;
    case "refillActionPoint":
      handlers.refillActionPoint();
      return;
    case "giveInventoryItem":
      handlers.giveInventoryItem(command.templateId);
      return;
    case "triggerCurrentFixedEvent":
      handlers.triggerCurrentFixedEvent();
      return;
    case "jumpToFixedEvent":
      handlers.jumpToFixedEvent(command.week, command.eventId, {
        resetCompletion: command.resetCompletion === true,
        runImmediately: false
      });
      return;
    case "runFixedEvent":
      handlers.jumpToFixedEvent(command.week, command.eventId, {
        resetCompletion: command.resetCompletion === true,
        runImmediately: true
      });
      return;
    case "resetFixedEventCompletion":
      handlers.resetFixedEventCompletion(command.eventId);
      return;
    case "resetFixedEventCompletionsForWeek":
      handlers.resetFixedEventCompletionsForWeek(command.week);
      return;
    case "saveAuto":
      handlers.saveAuto();
      return;
    case "startEndingFlow":
      handlers.startEndingFlow();
      return;
    case "startEndingFlowPreset":
      handlers.startEndingFlowPreset(command.endingId);
      return;
    default:
      assertNeverDebugCommand(command);
  }
}

export function resolveMainSceneDebugStartTile(sceneId: SceneId) {
  switch (sceneId) {
    case SCENE_IDS.classroomDefault:
      return { tileX: 27, tileY: 12 };
    default:
      return undefined;
  }
}

function assertNeverDebugCommand(command: never): never {
  throw new Error(`Unhandled debug command: ${JSON.stringify(command)}`);
}
