/**
 * 레거시 미니게임 공통 상수
 */

// 화면 크기
export const SCREEN = {
  W: 800,
  H: 600,
  CENTER_X: 400,
  CENTER_Y: 300,
} as const;

// 픽셀 폰트
export const PIXEL_FONT = '"Press Start 2P"';

// 색상 팔레트 (hex number - Phaser용)
export const COLORS = {
  // 배경
  bgDark: 0x0a0a1f,
  bgPanel: 0x0d1545,
  bgGrid: 0x1a2a3a,

  // 강조색
  gold: 0xffd700,
  green: 0x44ff88,
  blue: 0x4499ff,
  purple: 0xcc55ff,
  orange: 0xff6600,
  red: 0xff4466,
  redDark: 0xff4444,

  // 기본
  white: 0xffffff,
  black: 0x000000,
  gray: 0x888888,
} as const;

// 텍스트 색상 (hex string - Phaser Text용)
export const TEXT_COLORS = {
  white: "#ffffff",
  gold: "#FFD700",
  green: "#44ff88",
  blue: "#4499ff",
  purple: "#cc55ff",
  orange: "#ff6600",
  red: "#ff4466",
  gray: "#888888",
  hint: "#668888",
  info: "#88ccff",
} as const;

// 폰트 크기 프리셋
export const FONT_SIZES = {
  xs: "8px",
  sm: "9px",
  md: "12px",
  lg: "14px",
  xl: "18px",
  xxl: "24px",
  title: "20px",
  score: "12px",
  hint: "9px",
} as const;
