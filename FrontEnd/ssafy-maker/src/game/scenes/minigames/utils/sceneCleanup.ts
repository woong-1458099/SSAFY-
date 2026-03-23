import Phaser from "phaser";

export function registerSceneCleanup(scene: Phaser.Scene, cleanup: () => void): void {
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
}

export function destroyDomElement(domElement: Phaser.GameObjects.DOMElement | null): void {
  if (!domElement) {
    return;
  }

  const node = domElement.node;
  domElement.destroy();

  if (node?.parentNode) {
    node.parentNode.removeChild(node);
  }
}
