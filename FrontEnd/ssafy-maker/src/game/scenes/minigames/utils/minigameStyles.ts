/**
 * 레거시 미니게임 공통 텍스트 스타일
 */

import { PIXEL_FONT, TEXT_COLORS, FONT_SIZES } from "./minigameConstants";

type TextStyle = {
  fontSize: string;
  color: string;
  fontFamily: string;
  align?: string;
};

// 텍스트 스타일 프리셋
export const TEXT_STYLES = {
  // 제목
  title: {
    fontSize: FONT_SIZES.title,
    color: TEXT_COLORS.gold,
    fontFamily: PIXEL_FONT,
  },

  titleGreen: {
    fontSize: FONT_SIZES.xl,
    color: TEXT_COLORS.green,
    fontFamily: PIXEL_FONT,
  },

  titlePurple: {
    fontSize: FONT_SIZES.title,
    color: TEXT_COLORS.purple,
    fontFamily: PIXEL_FONT,
  },

  // 부제목
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.info,
    fontFamily: PIXEL_FONT,
  },

  // 점수
  score: {
    fontSize: FONT_SIZES.score,
    color: TEXT_COLORS.white,
    fontFamily: PIXEL_FONT,
  },

  scoreGreen: {
    fontSize: FONT_SIZES.score,
    color: TEXT_COLORS.green,
    fontFamily: PIXEL_FONT,
  },

  scoreRed: {
    fontSize: FONT_SIZES.score,
    color: TEXT_COLORS.red,
    fontFamily: PIXEL_FONT,
  },

  // 큰 숫자 (결과 화면용)
  bigNumber: {
    fontSize: "48px",
    color: TEXT_COLORS.white,
    fontFamily: PIXEL_FONT,
  },

  // 등급 표시
  grade: {
    fontSize: "56px",
    color: TEXT_COLORS.gold,
    fontFamily: PIXEL_FONT,
  },

  // 일반 텍스트
  body: {
    fontSize: FONT_SIZES.lg,
    color: TEXT_COLORS.white,
    fontFamily: PIXEL_FONT,
  },

  bodySmall: {
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.white,
    fontFamily: PIXEL_FONT,
  },

  // 힌트/안내
  hint: {
    fontSize: FONT_SIZES.hint,
    color: TEXT_COLORS.hint,
    fontFamily: PIXEL_FONT,
  },

  hintLight: {
    fontSize: FONT_SIZES.sm,
    color: TEXT_COLORS.info,
    fontFamily: PIXEL_FONT,
  },

  // 버튼 텍스트
  button: {
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.white,
    fontFamily: PIXEL_FONT,
  },

  // 판정 텍스트 (Perfect, Good, Miss 등)
  judgePerfect: {
    fontSize: FONT_SIZES.xxl,
    color: TEXT_COLORS.gold,
    fontFamily: PIXEL_FONT,
  },

  judgeGood: {
    fontSize: FONT_SIZES.xxl,
    color: TEXT_COLORS.green,
    fontFamily: PIXEL_FONT,
  },

  judgeMiss: {
    fontSize: FONT_SIZES.xxl,
    color: TEXT_COLORS.red,
    fontFamily: PIXEL_FONT,
  },

  // 타이머
  timer: {
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.red,
    fontFamily: PIXEL_FONT,
  },

  // 보상 텍스트
  reward: {
    fontSize: FONT_SIZES.md,
    color: TEXT_COLORS.gold,
    fontFamily: PIXEL_FONT,
  },
} as const satisfies Record<string, TextStyle>;

/**
 * 동적으로 스타일 생성
 */
export function createTextStyle(
  size: keyof typeof FONT_SIZES,
  color: keyof typeof TEXT_COLORS
): TextStyle {
  return {
    fontSize: FONT_SIZES[size],
    color: TEXT_COLORS[color],
    fontFamily: PIXEL_FONT,
  };
}
