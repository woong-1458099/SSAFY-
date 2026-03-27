import type { PlayerAppearanceDefinition, PlayerAppearanceSelection, PlayerGender } from "../../../common/types/player";

// 플레이어 외형 선택 규칙은 정의 계층에서만 관리한다.
export const PLAYER_APPEARANCE_LIMITS: Record<PlayerGender, { hairMin: number; hairMax: number }> = {
  male: { hairMin: 1, hairMax: 3 },
  female: { hairMin: 1, hairMax: 3 }
} as const;

export const PLAYER_CLOTH_LIMITS = {
  clothMin: 1,
  clothMax: 3
} as const;

export const DEFAULT_PLAYER_APPEARANCE: PlayerAppearanceDefinition = {
  gender: "male",
  hair: 1,
  cloth: 1,
  displayScale: 2.4
};

// 외형 선택이 비어 있을 때 쓰는 기본 조합이다.
export function getDefaultPlayerAppearanceDefinition() {
  return DEFAULT_PLAYER_APPEARANCE;
}

// 정의 계층은 외형 조합을 런타임 비주얼 정의 형태로 만든다.
export function createPlayerAppearanceDefinition(
  selection: PlayerAppearanceSelection
): PlayerAppearanceDefinition {
  return {
    gender: selection.gender,
    hair: selection.hair,
    cloth: selection.cloth,
    displayScale: DEFAULT_PLAYER_APPEARANCE.displayScale
  };
}
