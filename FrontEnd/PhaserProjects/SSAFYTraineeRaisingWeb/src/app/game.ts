import Phaser from "phaser";
import { gameConfig } from "@app/config/gameConfig";

export function createGame(containerId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    ...gameConfig,
    parent: containerId
  };
  return new Phaser.Game(config);
}

