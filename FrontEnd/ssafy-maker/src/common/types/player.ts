// 플레이어 외형과 월드 좌표를 표현하는 공통 타입 정의
export type PlayerGender = "male" | "female";

export type PlayerAppearanceSelection = {
  gender: PlayerGender;
  hair: number;
  cloth: number;
};

export type PlayerAppearanceDefinition = {
  gender: PlayerGender;
  hair: number;
  cloth: number;
  displayScale: number;
};

export type PlayerSnapshot = {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
};
