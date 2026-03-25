import Phaser from "phaser";
import { buildGameAssetPath } from "../../common/assets/gameAssetPath";
import type { WeeklyPlanOptionId } from "./weeklyPlan";

export const WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS = {
  uiPractice: "weekly-plan-activity-ui-practice",
  restApiDb: "weekly-plan-activity-rest-api-db",
  teamProject: "weekly-plan-activity-team-project"
} as const;

const WEEKLY_PLAN_ACTIVITY_IMAGE_ASSETS: Array<{ key: string; path: string }> = [
  {
    key: WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS.uiPractice,
    path: buildGameAssetPath("ui", "UIpractice.png")
  },
  {
    key: WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS.restApiDb,
    path: buildGameAssetPath("ui", "DBconsult.png")
  },
  {
    key: WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS.teamProject,
    path: buildGameAssetPath("ui", "TeamPJT.png")
  }
];

export function preloadPlanningAssets(scene: Phaser.Scene): void {
  WEEKLY_PLAN_ACTIVITY_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

export function getWeeklyPlanActivityImageKey(optionId: WeeklyPlanOptionId): string {
  switch (optionId) {
    case "rest_api_db":
      return WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS.restApiDb;
    case "team_project":
      return WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS.teamProject;
    case "ui_practice":
    default:
      return WEEKLY_PLAN_ACTIVITY_IMAGE_KEYS.uiPractice;
  }
}
