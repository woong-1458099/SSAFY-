import type { Vector2 } from "../../../common/types/geometry";

const CLASSROOM_BLOCKED_ROWS: Array<[y: number, xs: number[]]> = [
  [0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]],
  [1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31]],
  [2, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]],
  [3, [0, 1, 2, 3, 8, 9, 10, 11, 12, 17, 18, 19, 20, 23, 24, 25, 26, 29, 30, 31]],
  [4, [8, 9, 10, 11, 12, 17, 18, 19, 20, 23, 24, 25, 26, 29, 30, 31]],
  [5, [8, 17, 18, 19, 20, 23, 24, 25, 26, 29]]
];

const CLASSROOM_WALKABLE_ROWS: Array<[y: number, xs: number[]]> = [
  [6, [13, 16]],
  [7, [27, 28, 29, 30, 31]],
  [9, [0, 1]],
  [10, [0, 1]],
  [11, [0, 1, 24]],
  [12, [0, 1, 24]],
  [13, [2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 20, 24, 25, 26]],
  [14, [26, 27, 28]]
];

function expandRows(rows: Array<[y: number, xs: number[]]>): Vector2[] {
  return rows.flatMap(([y, xs]) => xs.map((x) => ({ x, y })));
}

// Synced from debug patch file: debug-tile-editor-classroom (2).json
export const CLASSROOM_BLOCKED_TILES = expandRows(CLASSROOM_BLOCKED_ROWS);
export const CLASSROOM_WALKABLE_TILES = expandRows(CLASSROOM_WALKABLE_ROWS);
