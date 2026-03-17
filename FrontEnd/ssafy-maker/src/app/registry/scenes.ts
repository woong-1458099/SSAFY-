import { BootScene } from "@scenes/BootScene";
import { LoginScene } from "@scenes/LoginScene";
import { PreloadScene } from "@scenes/PreloadScene";
import { StartScene } from "@scenes/StartScene";
import { TitleScene } from "@scenes/TitleScene";
import { IntroScene } from "@scenes/IntroScene";
import { NewCharacterScene } from "@scenes/NewCharacterScene";
import { MainScene } from "@scenes/MainScene";
import { FinalSummaryScene } from "@scenes/FinalSummaryScene";
import { EndingIntroScene } from "@scenes/EndingIntroScene";
import { EndingComicScene } from "@scenes/EndingComicScene";

import LegacyBusinessSmileScene from "@scenes/legacyMinigames/BusinessSmileScene";
import LegacyCookingScene from "@scenes/legacyMinigames/CookingScene";
import LegacyDontSmileScene from "@scenes/legacyMinigames/DontSmileScene";
import LegacyDragScene from "@scenes/legacyMinigames/DragScene";
import LegacyGymScene from "@scenes/legacyMinigames/GymScene";
import LegacyLottoScene from "@scenes/legacyMinigames/LottoScene";
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
  StartScene,
  TitleScene,
  IntroScene,
  NewCharacterScene,
  MainScene,
  FinalSummaryScene,
  EndingIntroScene,
  EndingComicScene,
  LegacyMenuScene,
  LegacyMinigamePauseScene,
  LegacyQuizScene,
  LegacyRhythmScene,
  LegacyDragScene,

  LegacyRunnerScene,

  LegacyTypingScene,
  LegacyBusinessSmileScene,
  LegacyDontSmileScene,
  LegacyGymScene,
  LegacyCookingScene,
  LegacyLottoScene
];
