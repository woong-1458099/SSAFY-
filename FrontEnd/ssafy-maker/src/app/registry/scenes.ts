import { BootScene } from "@scenes/BootScene";
import { LoginScene } from "@scenes/LoginScene";
import { PreloadScene } from "@scenes/PreloadScene";
import { TitleScene } from "@scenes/TitleScene";
import { MainScene } from "@scenes/MainScene";
import LegacyAimScene from "@scenes/legacyMinigames/AimScene";
import LegacyBugScene from "@scenes/legacyMinigames/BugScene";
import LegacyBusinessSmileScene from "@scenes/legacyMinigames/BusinessSmileScene";
import LegacyDontSmileScene from "@scenes/legacyMinigames/DontSmileScene";
import LegacyDragScene from "@scenes/legacyMinigames/DragScene";
import LegacyMenuScene from "@scenes/legacyMinigames/MenuScene";
import LegacyMinigamePauseScene from "@scenes/legacyMinigames/MinigamePauseScene";
import LegacyQuizScene from "@scenes/legacyMinigames/QuizScene";
import LegacyRhythmScene from "@scenes/legacyMinigames/RhythmScene";
import LegacyRunnerScene from "@scenes/legacyMinigames/RunnerScene";
import LegacyTypingScene from "@scenes/legacyMinigames/TypingScene";

// Scene registration must be managed only in this file.
export const SCENE_REGISTRY = [
  BootScene,
  PreloadScene,
  LoginScene,
  TitleScene,
  MainScene,
  LegacyMenuScene,
  LegacyMinigamePauseScene,
  LegacyQuizScene,
  LegacyRhythmScene,
  LegacyDragScene,
  LegacyBugScene,
  LegacyRunnerScene,
  LegacyAimScene,
  LegacyTypingScene,
  LegacyBusinessSmileScene,
  LegacyDontSmileScene
];
