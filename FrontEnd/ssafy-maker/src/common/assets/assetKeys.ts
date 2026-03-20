// 배경, NPC, 맵 등에서 사용하는 에셋 키 문자열을 한곳에서 관리
export const ASSET_KEYS = {
  background: {
    world: "bg-world",
    downtown: "bg-downtown",
    campus: "bg-campus"
  },
  npc: {
    minsu: "npc-minsu",
    yuna: "npc-yuna",
    guide: "npc-guide"
  },
  map: {
    tilesetImage: "map_tiles_full_asset",
    tilesetTsx: "map_tileset_full_tsx",
    worldTmx: "map_tmx_world",
    downtownTmx: "map_tmx_downtown",
    campusTmx: "map_tmx_campus"
  }
} as const;
