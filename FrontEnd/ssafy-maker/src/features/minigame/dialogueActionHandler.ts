import type Phaser from "phaser";
import type { DialogueAction } from "../../common/types/dialogue";
import { launchMinigame, openMinigameMenu } from "./MinigameGateway";

export type DialogueActionContext = {
  scene: Phaser.Scene;
  returnSceneKey: string;
  openShop?: () => void;
};

export async function handleDialogueAction(scene: Phaser.Scene, action: DialogueAction, returnSceneKey: string = 'main'): Promise<void> {
  switch (action) {
    case "openMiniGame":
      openMinigameMenu(scene, returnSceneKey);
      return;
    case "playDrinking":
      launchMinigame(scene, "DrinkingScene", returnSceneKey);
      return;
    case "playInterview":
      launchMinigame(scene, "InterviewScene", returnSceneKey);
      return;
    case "playGym":
      launchMinigame(scene, "GymScene", returnSceneKey);
      return;
    case "playRhythm":
      launchMinigame(scene, "RhythmScene", returnSceneKey);
      return;
    case "playCooking":
      launchMinigame(scene, "CookingScene", returnSceneKey);
      return;
    case "playTank":
      launchMinigame(scene, "TankScene", returnSceneKey);
      return;
    case "playQuiz":
      launchMinigame(scene, "QuizScene", returnSceneKey);
      return;
    case "playRunner":
      launchMinigame(scene, "RunnerScene", returnSceneKey);
      return;
    case "playBusinessSmile":
      launchMinigame(scene, "BusinessSmileScene", returnSceneKey);
      return;
    case "playTyping":
      launchMinigame(scene, "TypingScene", returnSceneKey);
      return;
    case "playLotto":
      launchMinigame(scene, "LottoScene", returnSceneKey);
      return;
    case "playDontSmile":
      launchMinigame(scene, "DontSmileScene", returnSceneKey);
      return;
  }
}

export function createDialogueActionRunner(context: DialogueActionContext) {
  const { scene, returnSceneKey, openShop } = context;

  return (action: DialogueAction) => {
    switch (action) {
      case "openShop":
        openShop?.();
        return;
      case "openMiniGame":
        openMinigameMenu(scene, returnSceneKey);
        return;
      case "playDrinking":
        launchMinigame(scene, "DrinkingScene", returnSceneKey);
        return;
      case "playInterview":
        launchMinigame(scene, "InterviewScene", returnSceneKey);
        return;
      case "playGym":
        launchMinigame(scene, "GymScene", returnSceneKey);
        return;
      case "playRhythm":
        launchMinigame(scene, "RhythmScene", returnSceneKey);
        return;
      case "playCooking":
        launchMinigame(scene, "CookingScene", returnSceneKey);
        return;
      case "playTank":
        launchMinigame(scene, "TankScene", returnSceneKey);
        return;
      case "playQuiz":
        launchMinigame(scene, "QuizScene", returnSceneKey);
        return;
      case "playRunner":
        launchMinigame(scene, "RunnerScene", returnSceneKey);
        return;
      case "playBusinessSmile":
        launchMinigame(scene, "BusinessSmileScene", returnSceneKey);
        return;
      case "playTyping":
        launchMinigame(scene, "TypingScene", returnSceneKey);
        return;
      case "playLotto":
        launchMinigame(scene, "LottoScene", returnSceneKey);
        return;
      case "playDontSmile":
        launchMinigame(scene, "DontSmileScene", returnSceneKey);
        return;
    }
  };
}
