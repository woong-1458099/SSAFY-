export type AreaId = "world" | "downtown" | "campus";
export type WorldPlaceId = "home" | "downtown" | "campus" | "cafe" | "store";

export type WorldPlaceNode = {
  id: WorldPlaceId;
  label: string;
  x: number;
  y: number;
  zoneWidth: number;
  zoneHeight: number;
  movable: boolean;
};

export const WORLD_PLACE_NODES: WorldPlaceNode[] = [
  { id: "campus", label: "\uCEA0\uD37C\uC2A4", x: 190, y: 180, zoneWidth: 190, zoneHeight: 150, movable: true },
  { id: "home", label: "\uC9D1", x: 500, y: 210, zoneWidth: 180, zoneHeight: 150, movable: false },
  { id: "store", label: "\uD3B8\uC758\uC810", x: 830, y: 250, zoneWidth: 150, zoneHeight: 120, movable: false },
  { id: "cafe", label: "\uCE74\uD398", x: 420, y: 520, zoneWidth: 150, zoneHeight: 120, movable: false },
  { id: "downtown", label: "\uBC88\uD654\uAC00", x: 730, y: 180, zoneWidth: 170, zoneHeight: 140, movable: true }
];

export const AREA_LABEL: Record<AreaId, string> = {
  world: "\uC804\uCCB4 \uC9C0\uB3C4",
  downtown: "\uBC88\uD654\uAC00",
  campus: "\uCEA0\uD37C\uC2A4"
};

export const AREA_ENTRY_POINT: Record<Exclude<AreaId, "world">, { x: number; y: number }> = {
  downtown: { x: 216, y: 520 },
  campus: { x: 220, y: 520 }
};

export const AREA_TILESET_IMAGE_KEY = "map_tiles_full_asset";
export const AREA_TILESET_MARGIN = 0;

export const AREA_TMX_TEXT_KEYS: Record<AreaId, string> = {
  world: "map_tmx_world",
  downtown: "map_tmx_downtown",
  campus: "map_tmx_campus"
};

export const AREA_COLLISION_LAYER_NAMES: Record<AreaId, string[]> = {
  world: ["root", "build"],
  downtown: ["tile layer 5(4)", "tile layer 3", "build(foul)"],
  campus: ["tile layer 4(2)", "tile layer 3"]
};

export const AREA_INTERACTION_LAYER_NAMES: Record<AreaId, string[]> = {
  world: ["build"],
  downtown: ["build(total)"],
  campus: ["tile layer 2", "tile layer 4(2)"]
};

export const AREA_FOREGROUND_LAYER_NAMES: Partial<Record<AreaId, string[]>> = {
  world: ["tree"],
  downtown: ["build(hide)"]
};

export const AREA_FOREGROUND_LAYER_DEPTH = 31;
