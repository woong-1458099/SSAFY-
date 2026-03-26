import type Phaser from "phaser";
import type { DialogueAction } from "../../common/types/dialogue";
import { launchMinigame, openMinigameMenu } from "./MinigameGateway";

export type DialogueActionContext = {
  scene: Phaser.Scene;
  returnSceneKey: string;
  openShop?: () => void;
};

function launchStoryMinigame(scene: Phaser.Scene, sceneKey: Parameters<typeof launchMinigame>[1], returnSceneKey: string) {
  launchMinigame(scene, sceneKey, returnSceneKey, { unlockOnComplete: true });
}

export async function handleDialogueAction(scene: Phaser.Scene, action: DialogueAction, returnSceneKey: string = 'main'): Promise<void> {
  switch (action) {
    case "openMiniGame":
      openMinigameMenu(scene, returnSceneKey);
      return;
    case "playDrinking":
      launchStoryMinigame(scene, "DrinkingScene", returnSceneKey);
      return;
    case "playInterview":
      launchStoryMinigame(scene, "InterviewScene", returnSceneKey);
      return;
    case "playGym":
      launchStoryMinigame(scene, "GymScene", returnSceneKey);
      return;
    case "playRhythm":
      launchStoryMinigame(scene, "RhythmScene", returnSceneKey);
      return;
    case "playCooking":
      launchStoryMinigame(scene, "CookingScene", returnSceneKey);
      return;
    case "playTank":
      launchStoryMinigame(scene, "TankScene", returnSceneKey);
      return;
    case "playQuiz":
      launchStoryMinigame(scene, "QuizScene", returnSceneKey);
      return;
    case "playRunner":
      launchStoryMinigame(scene, "RunnerScene", returnSceneKey);
      return;
    case "playBusinessSmile":
      launchStoryMinigame(scene, "BusinessSmileScene", returnSceneKey);
      return;
    case "playTyping":
      launchStoryMinigame(scene, "TypingScene", returnSceneKey);
      return;
    case "playLotto":
      launchStoryMinigame(scene, "LottoScene", returnSceneKey);
      return;
    case "playDontSmile":
      launchStoryMinigame(scene, "DontSmileScene", returnSceneKey);
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
        launchStoryMinigame(scene, "DrinkingScene", returnSceneKey);
        return;
      case "playInterview":
        launchStoryMinigame(scene, "InterviewScene", returnSceneKey);
        return;
      case "playGym":
        launchStoryMinigame(scene, "GymScene", returnSceneKey);
        return;
      case "playRhythm":
        launchStoryMinigame(scene, "RhythmScene", returnSceneKey);
        return;
      case "playCooking":
        launchStoryMinigame(scene, "CookingScene", returnSceneKey);
        return;
      case "playTank":
        launchStoryMinigame(scene, "TankScene", returnSceneKey);
        return;
      case "playQuiz":
        launchStoryMinigame(scene, "QuizScene", returnSceneKey);
        return;
      case "playRunner":
        launchStoryMinigame(scene, "RunnerScene", returnSceneKey);
        return;
      case "playBusinessSmile":
        launchStoryMinigame(scene, "BusinessSmileScene", returnSceneKey);
        return;
      case "playTyping":
        launchStoryMinigame(scene, "TypingScene", returnSceneKey);
        return;
      case "playLotto":
        launchStoryMinigame(scene, "LottoScene", returnSceneKey);
        return;
      case "playDontSmile":
        launchStoryMinigame(scene, "DontSmileScene", returnSceneKey);
        return;
    }
  };
}
