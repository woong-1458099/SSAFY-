import Phaser from "phaser";
import type { AreaId } from "../../../common/enums/area";

type AreaRefreshCoordinatorOptions = {
  scene: Phaser.Scene;
  refresh: (
    expectedAreaId?: AreaId,
    expectedPlayerSnapshot?: { tileX: number; tileY: number },
    requestId?: number
  ) => void;
  canRefresh: () => boolean;
};

export class MainSceneAreaRefreshCoordinator {
  private readonly scene: Phaser.Scene;
  private readonly refresh: AreaRefreshCoordinatorOptions["refresh"];
  private readonly canRefresh: AreaRefreshCoordinatorOptions["canRefresh"];
  private pendingTimer?: Phaser.Time.TimerEvent;
  private pendingRequestId = 0;
  private shutdownHandler: () => void;

  constructor(options: AreaRefreshCoordinatorOptions) {
    this.scene = options.scene;
    this.refresh = options.refresh;
    this.canRefresh = options.canRefresh;
    this.shutdownHandler = () => {
      this.dispose();
    };

    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdownHandler);
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.shutdownHandler);
  }

  getRequestId(): number {
    // This token represents the latest request or cancellation boundary, not only completed refreshes.
    return this.pendingRequestId;
  }

  queue(expectedAreaId: AreaId, expectedPlayerSnapshot?: { tileX: number; tileY: number }): void {
    this.clear();
    const requestId = ++this.pendingRequestId;
    this.pendingTimer = this.scene.time.delayedCall(0, () => {
      try {
        if (this.pendingRequestId !== requestId || !this.canRefresh()) {
          return;
        }

        this.refresh(expectedAreaId, expectedPlayerSnapshot, requestId);
      } finally {
        this.finalize(requestId);
      }
    });
  }

  clear(): void {
    this.pendingRequestId += 1;
    this.finalize();
  }

  dispose(): void {
    this.clear();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdownHandler);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.shutdownHandler);
  }

  finalize(requestId?: number): void {
    if (requestId !== undefined && requestId !== this.pendingRequestId) {
      return;
    }

    this.pendingTimer?.remove(false);
    this.pendingTimer = undefined;
  }
}
