import Phaser from "phaser";
import type { AreaId } from "../../../common/enums/area";

type AreaRefreshCoordinatorOptions = {
  scene: Phaser.Scene;
  refresh: (
    expectedAreaId?: AreaId,
    expectedPlayerSnapshot?: { tileX: number; tileY: number },
    request?: {
      requestId: number;
      signal: AbortSignal;
      isCurrentRequest: () => boolean;
    }
  ) => void | Promise<void>;
  canRefresh: () => boolean;
};

type PendingAreaRefreshTask = {
  requestId: number;
  timer: Phaser.Time.TimerEvent;
  controller: AbortController;
};

export class MainSceneAreaRefreshCoordinator {
  private readonly scene: Phaser.Scene;
  private readonly refresh: AreaRefreshCoordinatorOptions["refresh"];
  private readonly canRefresh: AreaRefreshCoordinatorOptions["canRefresh"];
  private pendingTask?: PendingAreaRefreshTask;
  private pendingRequestId = 0;
  private shutdownHandler: () => void;
  private isDisposed = false;
  private isRefreshRunning = false;

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

  isRefreshInProgress(): boolean {
    return this.isRefreshRunning;
  }

  queue(expectedAreaId: AreaId, expectedPlayerSnapshot?: { tileX: number; tileY: number }): void {
    if (this.isDisposed) {
      return;
    }

    this.clear();
    const requestId = ++this.pendingRequestId;
    const controller = new AbortController();
    const pendingTask = {
      requestId,
      controller,
      timer: undefined as Phaser.Time.TimerEvent | undefined
    };
    const timer = this.scene.time.delayedCall(0, () => {
      if (!this.isCurrentTask(requestId, pendingTask) || !this.canRefresh()) {
        this.finalize(requestId, pendingTask);
        return;
      }

      this.isRefreshRunning = true;
      void Promise.resolve()
        .then(() =>
          this.refresh(expectedAreaId, expectedPlayerSnapshot, {
            requestId,
            signal: controller.signal,
            isCurrentRequest: () => this.isCurrentTask(requestId, pendingTask)
          })
        )
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }
          console.error("[MainSceneAreaRefreshCoordinator] refresh failed", {
            requestId,
            error
          });
        })
        .finally(() => {
          this.isRefreshRunning = false;
          this.finalize(requestId, pendingTask);
        });
    });
    pendingTask.timer = timer;
    this.pendingTask = {
      requestId,
      controller,
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
    this.pendingTask?.controller.abort();
    this.pendingRequestId += 1;
    this.finalize();
  }

  private isCurrentTask(requestId: number, pendingTask: { timer: Phaser.Time.TimerEvent | undefined }): boolean {
    return (
      this.pendingRequestId === requestId &&
      this.pendingTask?.requestId === requestId &&
      this.pendingTask?.timer === pendingTask.timer
    );
  }
}
