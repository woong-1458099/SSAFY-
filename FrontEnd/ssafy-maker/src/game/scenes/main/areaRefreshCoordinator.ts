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
  private pendingTask?: {
    requestId: number;
    timer: Phaser.Time.TimerEvent;
  };
  private pendingRequestId = 0;
  private shutdownHandler: () => void;
  private isDisposed = false;

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
    if (this.isDisposed) {
      return;
    }

    this.clear();
    const requestId = ++this.pendingRequestId;
    const pendingTask = {
      requestId,
      timer: undefined as Phaser.Time.TimerEvent | undefined
    };
    const timer = this.scene.time.delayedCall(0, () => {
      try {
        if (this.pendingRequestId !== requestId || !this.canRefresh()) {
          return;
        }

        this.refresh(expectedAreaId, expectedPlayerSnapshot, requestId);
      } finally {
        this.finalize(requestId, pendingTask);
      }
    });
    pendingTask.timer = timer;
    this.pendingTask = {
      requestId,
      timer
    };
  }

  clear(): void {
    if (this.isDisposed) {
      return;
    }

    this.cancelPending();
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.cancelPending();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdownHandler);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.shutdownHandler);
    this.isDisposed = true;
  }

  finalize(
    requestId?: number,
    pendingTask?: {
      requestId: number;
      timer: Phaser.Time.TimerEvent | undefined;
    }
  ): void {
    if (!this.pendingTask) {
      return;
    }

    if (requestId !== undefined && requestId !== this.pendingTask.requestId) {
      return;
    }

    if (pendingTask !== undefined && pendingTask.timer !== this.pendingTask.timer) {
      return;
    }

    this.pendingTask.timer.remove(false);
    this.pendingTask = undefined;
  }

  private cancelPending(): void {
    this.pendingRequestId += 1;
    this.finalize();
  }
}
