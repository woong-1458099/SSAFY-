import Phaser from "phaser";
import { GAME_CONFIG } from "./config/gameConfig";
import { seedAuthRegistry, type AuthBootstrapState } from "../features/auth/AuthGateway";

export const createGame = (authBootstrap?: AuthBootstrapState) =>
  new Phaser.Game({
    ...GAME_CONFIG,
    callbacks: {
      ...GAME_CONFIG.callbacks,
      preBoot: (game) => {
        seedAuthRegistry(game, authBootstrap);
        GAME_CONFIG.callbacks?.preBoot?.(game);
      }
    }
  });
