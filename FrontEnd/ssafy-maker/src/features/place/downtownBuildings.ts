import Phaser from "phaser";
import type { DowntownBuildingId } from "./placeActions";

export type DowntownBuildingDefinition = {
  id: DowntownBuildingId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
};

export type DowntownBuildingProximityTarget = {
  id: DowntownBuildingId;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const DOWNTOWN_BUILDINGS: DowntownBuildingDefinition[] = [
  { id: "gym", label: "\uD5EC\uC2A4\uC7A5", x: 290, y: 278, w: 150, h: 106, color: 0xb79f86 },
  { id: "ramenthings", label: "\uB77C\uBA74\uD305\uC2A4", x: 492, y: 262, w: 166, h: 108, color: 0xd4a875 },
  { id: "hof", label: "\uD638\uD504", x: 712, y: 286, w: 160, h: 108, color: 0xb48a66 },
  { id: "karaoke", label: "\uB178\uB798\uBC29", x: 454, y: 406, w: 174, h: 116, color: 0xc495a3 },
  { id: "lottery", label: "\uBCF5\uAD8C\uD310\uB9E4\uC810", x: 696, y: 412, w: 190, h: 116, color: 0xbfad77 }
];

export function findNearestDowntownBuilding(
  targets: DowntownBuildingProximityTarget[],
  playerX: number,
  playerY: number,
  maxDistance: number
): DowntownBuildingId | null {
  let nearestId: DowntownBuildingId | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  targets.forEach((target) => {
    const nearestX = Phaser.Math.Clamp(playerX, target.left, target.right);
    const nearestY = Phaser.Math.Clamp(playerY, target.top, target.bottom);
    const distance = Phaser.Math.Distance.Between(playerX, playerY, nearestX, nearestY);
    if (distance <= maxDistance && distance < nearestDistance) {
      nearestId = target.id;
      nearestDistance = distance;
    }
  });

  return nearestId;
}
