import { BootScene } from "../../game/scenes/BootScene";
import { PreloadScene } from "../../game/scenes/PreloadScene";
import { MainScene } from "../../game/scenes/MainScene";
import { MiniGameCenterScene } from "../../game/scenes/minigames/MiniGameCenterScene";
import { MiniGameReflexScene } from "../../game/scenes/minigames/MiniGameReflexScene";
import LegacyBusinessSmileScene from "../../game/scenes/minigames/BusinessSmileScene";
import LegacyCookingScene from "../../game/scenes/minigames/CookingScene";
import LegacyDontSmileScene from "../../game/scenes/minigames/DontSmileScene";
import LegacyDrinkingScene from "../../game/scenes/minigames/DrinkingScene";
import LegacyGymScene from "../../game/scenes/minigames/GymScene";
import LegacyInterviewScene from "../../game/scenes/minigames/InterviewScene";
import LegacyLottoScene from "../../game/scenes/minigames/LottoScene";
import LegacyMenuScene from "../../game/scenes/minigames/MenuScene";
import LegacyMinigamePauseScene from "../../game/scenes/minigames/MinigamePauseScene";
import LegacyQuizScene from "../../game/scenes/minigames/QuizScene";
import LegacyRhythmScene from "../../game/scenes/minigames/RhythmScene";
import LegacyRunnerScene from "../../game/scenes/minigames/RunnerScene";
import LegacyTankScene from "../../game/scenes/minigames/TankScene";
import LegacyTypingScene from "../../game/scenes/minigames/TypingScene";

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
  LegacyTypingScene,
  LegacyBusinessSmileScene,
  LegacyDontSmileScene,
  LegacyGymScene,
  LegacyCookingScene,
  LegacyLottoScene,
  LegacyDrinkingScene,
  MiniGameCenterScene,
  MiniGameReflexScene
];
