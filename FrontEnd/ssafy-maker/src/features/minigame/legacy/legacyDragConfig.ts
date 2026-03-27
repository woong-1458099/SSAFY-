export const LEGACY_DRAG_TOTAL_TIME = 60;

export const LEGACY_DRAG_CHALLENGES = [
  {
    desc: "BUBBLE SORT",
    lines: [
      "for i in range(n):",
      "  for j in range(n-i-1):",
      "    if arr[j] > arr[j+1]:",
      "      arr[j], arr[j+1] = arr[j+1], arr[j]"
    ]
  },
  {
    desc: "FIBONACCI SEQUENCE",
    lines: [
      "def fib(n):",
      "  if n <= 1: return n",
      "  a, b = 0, 1",
      "  for _ in range(n-1):",
      "    a, b = b, a+b",
      "  return b"
    ]
  },
  {
    desc: "BINARY SEARCH",
    lines: [
      "def binary_search(arr, target):",
      "  left, right = 0, len(arr)-1",
      "  while left <= right:",
      "    mid = (left + right) // 2",
      "    if arr[mid] == target: return mid",
      "    elif arr[mid] < target: left = mid + 1",
      "    else: right = mid - 1",
      "  return -1"
    ]
  },
] as const;

const LEGACY_DRAG_SUCCESS_RULES = [
  { minRemainingTime: 41, message: "⚡ PERFECT! GENIUS CODER!", color: "#FFD700", reward: "BE +5, GP +15" },
  { minRemainingTime: 21, message: "✅ CORRECT!", color: "#00ff88", reward: "BE +3, GP +10" },
  { minRemainingTime: 0, message: "👍 CLEAR!", color: "#aaddff", reward: "BE +2, GP +5" },
] as const;

export function resolveLegacyDragSuccess(remainingTime: number) {
  return LEGACY_DRAG_SUCCESS_RULES.find((rule) => remainingTime >= rule.minRemainingTime) ?? LEGACY_DRAG_SUCCESS_RULES[LEGACY_DRAG_SUCCESS_RULES.length - 1];
}

export const LEGACY_DRAG_FAILURE = {
  message: "⏰ TIME UP...",
  color: "#ff4444",
  reward: "STRESS +3"
} as const;
