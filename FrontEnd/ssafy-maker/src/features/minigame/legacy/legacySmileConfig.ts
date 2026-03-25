export const LEGACY_SMILE_PIXEL_FONT = '"Press Start 2P"';
export const LEGACY_SMILE_CAMERA_WIDTH = 640;
export const LEGACY_SMILE_CAMERA_HEIGHT = 480;
export const LEGACY_SMILE_THRESHOLD = 0.4;
export const LEGACY_SMILE_MAX_GAUGE = 100;

export const LEGACY_BUSINESS_SMILE_CONFIG = {
  title: "비즈니스 웃음",
  subtitle: "자연스럽게 웃음을 유지해 게이지를 끝까지 채우세요.",
  sceneLabel: "웃음을 유지해서 게이지를 100까지 채우면 성공합니다.",
  theme: {
    panel: 0x0a2544,
    border: 0x3ea3ff,
    accent: "#9fd8ff",
    gauge: "#24e1ff",
    danger: "#ff5e6c",
  },
  initialStatus: "자연스럽게 웃으세요. 웃음이 커질수록 게이지가 더 잘 찹니다."
} as const;

export const LEGACY_DONT_SMILE_SURVIVAL_TICKS = 900;

export const LEGACY_DONT_SMILE_CONFIG = {
  title: "웃음참기",
  subtitle: "웃으면 위험 게이지가 오릅니다. 끝까지 표정을 유지하세요.",
  sceneLabel: "정색을 유지한 채 제한 시간을 버티면 성공합니다.",
  theme: {
    panel: 0x3a0b18,
    border: 0xff5f7c,
    accent: "#ffc7d4",
    gauge: "#ff6b6b",
    danger: "#ff2f57",
  },
  initialStatus: "표정을 최대한 유지하세요. 웃으면 위험 게이지가 빠르게 상승합니다."
} as const;
