import Phaser from "phaser";
import type { PlayerAppearanceDefinition, PlayerAppearanceSelection, PlayerGender } from "../../../common/types/player";
import {
  createPlayerAppearanceDefinition,
  getDefaultPlayerAppearanceDefinition,
  PLAYER_APPEARANCE_LIMITS,
  PLAYER_CLOTH_LIMITS
} from "./playerAppearanceDefinitions";

type RawPlayerData = Partial<{
  gender: unknown;
  hair: unknown;
  cloth: unknown;
}>;

function resolveGender(rawGender: unknown): PlayerGender {
  return rawGender === "female" ? "female" : "male";
}

function resolveHair(rawHair: unknown, gender: PlayerGender) {
  const limits = PLAYER_APPEARANCE_LIMITS[gender];
  const numericHair = Number(rawHair ?? getDefaultPlayerAppearanceDefinition().hair);
  return Phaser.Math.Clamp(Math.round(numericHair), limits.hairMin, limits.hairMax);
}

function resolveCloth(rawCloth: unknown) {
  const numericCloth = Number(rawCloth ?? getDefaultPlayerAppearanceDefinition().cloth);
  return Phaser.Math.Clamp(
    Math.round(numericCloth),
    PLAYER_CLOTH_LIMITS.clothMin,
    PLAYER_CLOTH_LIMITS.clothMax
  );
}

// registry 등 외부 입력값을 안전한 플레이어 외형 조합으로 정규화한다.
export function resolvePlayerAppearanceSelection(rawPlayerData?: RawPlayerData): PlayerAppearanceSelection {
  const gender = resolveGender(rawPlayerData?.gender);

  return {
    gender,
    hair: resolveHair(rawPlayerData?.hair, gender),
    cloth: resolveCloth(rawPlayerData?.cloth)
  };
}

// 런타임 입력값을 실제 렌더 가능한 appearance definition으로 만든다.
export function resolvePlayerAppearanceDefinition(rawPlayerData?: RawPlayerData): PlayerAppearanceDefinition {
  const selection = resolvePlayerAppearanceSelection(rawPlayerData);
  return createPlayerAppearanceDefinition(selection);
}
