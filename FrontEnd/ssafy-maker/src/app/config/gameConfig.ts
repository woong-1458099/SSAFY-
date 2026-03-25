import Phaser from "phaser";
import { SCENE_REGISTRY } from "../registry/sceneRegistry";

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "app",
  backgroundColor: "#1f2430",
  pixelArt: true,
  antialias: false,
  scene: SCENE_REGISTRY,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // 🌟 추가됨: 픽셀 연산 과부하를 막기 위해 초당 30프레임으로 타겟 제한
  fps: {
    target: 30,
    forceSetTimeOut: true
  },
  // 🌟 추가됨: 브라우저의 고성능 GPU 사용을 유도하고 렌더링 효율을 높임
  render: {
    batchSize: 512,
    powerPreference: 'high-performance'
  },
  dom: {
    // Only the smile minigames (BusinessSmileScene / DontSmileScene via BaseSmileScene)
    // use Phaser DOMElement for the camera surface.
    // Those scenes are required to use the shared sceneCleanup helper on shutdown/destroy.
    createContainer: true
  }
};