import Phaser from "phaser";

type SceneCleanupState = {
  installed: boolean;
  cleanup: () => void;
};

const SCENE_CLEANUP_STATE_KEY = "__sceneCleanupState";

function getCleanupState(scene: Phaser.Scene): SceneCleanupState | undefined {
  return (scene as Phaser.Scene & { [SCENE_CLEANUP_STATE_KEY]?: SceneCleanupState })[SCENE_CLEANUP_STATE_KEY];
}

function setCleanupState(scene: Phaser.Scene, state?: SceneCleanupState): void {
  const typedScene = scene as Phaser.Scene & { [SCENE_CLEANUP_STATE_KEY]?: SceneCleanupState };
  if (state) {
    typedScene[SCENE_CLEANUP_STATE_KEY] = state;
    return;
  }

  delete typedScene[SCENE_CLEANUP_STATE_KEY];
}

// DOM-based minigame scenes must register cleanup through this helper so
// shutdown and destroy follow the same teardown path.
export function registerSceneCleanup(scene: Phaser.Scene, cleanup: () => void): void {
  const existingState = getCleanupState(scene);
  if (existingState?.installed) {
    return;
  }

  const state: SceneCleanupState = {
    installed: true,
    cleanup: () => {
      if (!state.installed) {
        return;
      }

      state.installed = false;
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, state.cleanup);
      scene.events.off(Phaser.Scenes.Events.DESTROY, state.cleanup);
      setCleanupState(scene);
      cleanup();
    }
  };

  setCleanupState(scene, state);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, state.cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, state.cleanup);
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
