export type CharacterCreationLayout = {
  titleY: number;
  previewX: number;
  previewY: number;
  uiBoxWidth: number;
  uiBoxHeight: number;
  uiX: number;
  nameY: number;
  labelOffsetX: number;
  genderY: number;
  maleButtonOffsetX: number;
  femaleButtonOffsetX: number;
  genderButtonScale: number;
  selectorY: {
    hair: number;
    cloth: number;
  };
  selectorStartOffsetX: number;
  selectorSpacing: number;
  startButtonY: number;
  startButtonWidth: number;
  startButtonHeight: number;
};

export function getCharacterCreationLayout(width: number, height: number): CharacterCreationLayout {
  return {
    titleY: height * 0.18,
    previewX: Math.floor(width * 0.35),
    previewY: Math.floor(height * 0.5),
    uiBoxWidth: width * 0.9,
    uiBoxHeight: height * 0.8,
    uiX: width * 0.65,
    nameY: height * 0.35,
    labelOffsetX: 130,
    genderY: height * 0.47,
    maleButtonOffsetX: -20,
    femaleButtonOffsetX: 60,
    genderButtonScale: 1.2,
    selectorY: {
      hair: height * 0.57,
      cloth: height * 0.67
    },
    selectorStartOffsetX: -40,
    selectorSpacing: 60,
    startButtonY: height * 0.94,
    startButtonWidth: 200,
    startButtonHeight: 60
  };
}
