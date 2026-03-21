import { BootScene } from "../../game/scenes/BootScene";
import { PreloadScene } from "../../game/scenes/PreloadScene";
import { MainScene } from "../../game/scenes/MainScene";
import { MiniGameCenterScene } from "../../game/scenes/minigames/MiniGameCenterScene";
import { MiniGameReflexScene } from "../../game/scenes/minigames/MiniGameReflexScene";
import { MiniGameTypingScene } from "../../game/scenes/minigames/MiniGameTypingScene";
import LegacyBusinessSmileScene from "../../game/scenes/legacyMinigames/BusinessSmileScene";
import LegacyCookingScene from "../../game/scenes/legacyMinigames/CookingScene";
import LegacyDontSmileScene from "../../game/scenes/legacyMinigames/DontSmileScene";
import LegacyDragScene from "../../game/scenes/legacyMinigames/DragScene";
import LegacyDrinkingScene from "../../game/scenes/legacyMinigames/DrinkingScene";
import LegacyGymScene from "../../game/scenes/legacyMinigames/GymScene";
import LegacyInterviewScene from "../../game/scenes/legacyMinigames/InterviewScene";
import LegacyLottoScene from "../../game/scenes/legacyMinigames/LottoScene";
import LegacyMenuScene from "../../game/scenes/legacyMinigames/MenuScene";
import LegacyMinigamePauseScene from "../../game/scenes/legacyMinigames/MinigamePauseScene";
import LegacyQuizScene from "../../game/scenes/legacyMinigames/QuizScene";
import LegacyRhythmScene from "../../game/scenes/legacyMinigames/RhythmScene";
import LegacyRunnerScene from "../../game/scenes/legacyMinigames/RunnerScene";
import LegacyTankScene from "../../game/scenes/legacyMinigames/TankScene";
import LegacyTypingScene from "../../game/scenes/legacyMinigames/TypingScene";

export const SCENE_REGISTRY = [
  BootScene,
  PreloadScene,
  MainScene,
  LegacyMenuScene,
  LegacyMinigamePauseScene,
  LegacyQuizScene,
  LegacyRhythmScene,
  LegacyInterviewScene,
  LegacyRunnerScene,
  LegacyTankScene,
  LegacyDragScene,
  LegacyTypingScene,
  LegacyBusinessSmileScene,
  LegacyDontSmileScene,
  LegacyGymScene,
  LegacyCookingScene,
  LegacyLottoScene,
  LegacyDrinkingScene,
  MiniGameCenterScene,
  MiniGameTypingScene,
  MiniGameReflexScene
];
