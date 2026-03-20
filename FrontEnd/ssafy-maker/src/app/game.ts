import Phaser from "phaser";
import { GAME_CONFIG } from "./config/gameConfig";

export const createGame = () => new Phaser.Game(GAME_CONFIG);
