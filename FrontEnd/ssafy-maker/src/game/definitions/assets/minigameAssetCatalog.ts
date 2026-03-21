import { buildGameAssetPath } from "../../../common/assets/gameAssetPath";

export const MINIGAME_ASSET_CATALOG = {
  ramen: {
    bgm: buildGameAssetPath("audio", "BGM", "ramen_game.mp3"),
    background: buildGameAssetPath("minigame", "ramen", "cooking_bg.png"),
    ingredients: buildGameAssetPath("minigame", "ramen", "ramen_ing.png"),
    pot: buildGameAssetPath("minigame", "ramen", "pot.png")
  },
  beer: {
    bgm: buildGameAssetPath("audio", "BGM", "beer_game.mp3"),
    background: buildGameAssetPath("minigame", "beer", "beer_background.png"),
    tableBack: buildGameAssetPath("minigame", "beer", "beer_back.png"),
    tableFront: buildGameAssetPath("minigame", "beer", "beer_front.png"),
    beerGlass: buildGameAssetPath("minigame", "beer", "beer_glass.png"),
    grandma: buildGameAssetPath("minigame", "beer", "halmak.png")
  }
} as const;
