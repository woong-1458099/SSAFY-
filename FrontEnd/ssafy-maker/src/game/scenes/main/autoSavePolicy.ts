export function shouldDelayAutoSaveForInputLock(options: {
  nowMs: number;
  lockedUntilMs: number;
}): boolean {
  return options.nowMs < options.lockedUntilMs;
}
