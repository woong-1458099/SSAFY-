import Phaser from "phaser";

// DOM-based minigame scenes must register cleanup through this helper so
// shutdown and destroy follow the same teardown path.
export function registerSceneCleanup(scene: Phaser.Scene, cleanup: () => void): void {
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
}

// Phaser destroys the DOMElement wrapper, but we also remove the underlying
// node explicitly so the shared DOM container cannot retain stale children.
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
