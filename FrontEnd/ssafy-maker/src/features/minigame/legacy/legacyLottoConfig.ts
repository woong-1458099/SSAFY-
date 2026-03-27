export const LEGACY_LOTTO_TOTAL_NUMBERS = 45;
export const LEGACY_LOTTO_PICK_COUNT = 6;

export const LEGACY_LOTTO_GRID = {
  startX: 115,
  startY: 115,
  columns: 9,
  spacing: 65
} as const;

export function getLegacyLottoBallColor(num: number): number {
  if (num <= 10) return 0xfbc400;
  if (num <= 20) return 0x69c8f2;
  if (num <= 30) return 0xff7272;
  if (num <= 40) return 0xaaaaaa;
  return 0xb0d840;
}
