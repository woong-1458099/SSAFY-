import { ASSET_KEYS } from "../../../common/assets/assetKeys";

// 버튼 시트에서 아레아 이동 포인트 표시에 사용할 프레임 규칙을 관리한다.
export const AREA_TRANSITION_MARKER_SPRITE = {
  textureKey: ASSET_KEYS.ui.buttons,
  frameWidth: 24,
  frameHeight: 24
} as const;

export const AREA_TRANSITION_MARKER_FRAMES = {
  idle: 23,
  active: 22
} as const;
