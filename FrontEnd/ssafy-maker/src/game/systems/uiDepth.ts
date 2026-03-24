import { RENDER_DEPTH } from "./renderDepth";

const SCREEN_UI_BASE = RENDER_DEPTH.foregroundMap + 100;

// 화면 고정 UI는 월드 foreground보다 항상 앞에서 렌더한다.
export const UI_DEPTH = {
  fixedEventNpcSprite: SCREEN_UI_BASE,
  fixedEventNpcLabel: SCREEN_UI_BASE + 1,
  hud: SCREEN_UI_BASE + 300,
  areaTransitionZone: SCREEN_UI_BASE + 400,
  areaTransitionLabel: SCREEN_UI_BASE + 401,
  worldGridWalkable: SCREEN_UI_BASE + 500,
  worldGridBlocked: SCREEN_UI_BASE + 501,
  worldGridInteraction: SCREEN_UI_BASE + 502,
  menu: SCREEN_UI_BASE + 900,
  planner: SCREEN_UI_BASE + 1000,
  salary: SCREEN_UI_BASE + 1050,
  placeModal: SCREEN_UI_BASE + 1100,
  tutorial: SCREEN_UI_BASE + 1150,
  dialogue: SCREEN_UI_BASE + 1200,
  debugMinigameHud: SCREEN_UI_BASE + 1300,
  debugOverlay: SCREEN_UI_BASE + 1400,
  debugPanel: SCREEN_UI_BASE + 1500
} as const;
