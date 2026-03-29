import Phaser from "phaser";
import type { AreaId } from "../../../common/enums/area";

export function shouldAbortAreaRefreshRequest(request?: {
  signal: AbortSignal;
  isCurrentRequest: () => boolean;
}): boolean {
  return request?.signal.aborted === true || (request !== undefined && !request.isCurrentRequest());
}

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
  timer: Phaser.Time.TimerEvent | undefined;
  controller: AbortController;
  retryCount: number;
};

export class MainSceneAreaRefreshCoordinator {
  private readonly scene: Phaser.Scene;
  private readonly refresh: AreaRefreshCoordinatorOptions["refresh"];
  private readonly canRefresh: AreaRefreshCoordinatorOptions["canRefresh"];
  private pendingTask?: PendingAreaRefreshTask;
  private pendingRequestId = 0;
  private runningRequestId?: number;
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

    // These listeners are removed in `dispose()` so restarted scenes do not accumulate coordinator handlers.
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
    const pendingTask: PendingAreaRefreshTask = {
      requestId,
      controller,
      retryCount: 0,
      timer: undefined
    };
    this.pendingTask = pendingTask;
    const timer = this.scheduleTask(expectedAreaId, expectedPlayerSnapshot, pendingTask, 0);
    pendingTask.timer = timer;
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
    this.runningRequestId = undefined;
    this.isRefreshRunning = false;
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdownHandler);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.shutdownHandler);
    this.isDisposed = true;
  }

  finalize(
    requestId?: number,
    pendingTask?: Pick<PendingAreaRefreshTask, "requestId" | "timer">
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

    this.pendingTask.timer?.remove(false);
    this.pendingTask = undefined;
  }

  private cancelPending(): void {
    const canceledRequestId = this.pendingTask?.requestId;
    this.pendingTask?.controller.abort();
    if (canceledRequestId !== undefined) {
      this.cancelRunningRefresh(canceledRequestId);
    }
    this.pendingRequestId += 1;
    this.finalize();
  }

  private isCurrentTask(requestId: number, pendingTask: Pick<PendingAreaRefreshTask, "timer">): boolean {
    return (
      this.pendingRequestId === requestId &&
      this.pendingTask?.requestId === requestId &&
      this.pendingTask?.timer === pendingTask.timer
    );
  }

  private scheduleTask(
    expectedAreaId: AreaId | undefined,
    expectedPlayerSnapshot: { tileX: number; tileY: number } | undefined,
    pendingTask: PendingAreaRefreshTask,
    delayMs: number
  ): Phaser.Time.TimerEvent {
    return this.scene.time.delayedCall(delayMs, () => {
      if (!this.canAccessSceneRuntime()) {
        this.cancelRunningRefresh(pendingTask.requestId);
        this.finalize(pendingTask.requestId, pendingTask);
        return;
      }

      if (!this.isCurrentTask(pendingTask.requestId, pendingTask)) {
        this.finalize(pendingTask.requestId, pendingTask);
        return;
      }

      if (!this.canRefresh()) {
        if (pendingTask.retryCount >= 1) {
          this.finalize(pendingTask.requestId, pendingTask);
          return;
        }

        pendingTask.retryCount += 1;
        const retryTimer = this.scheduleTask(expectedAreaId, expectedPlayerSnapshot, pendingTask, 0);
        pendingTask.timer = retryTimer;
        return;
      }

      if (!this.canAccessSceneRuntime()) {
        this.cancelRunningRefresh(pendingTask.requestId);
        this.finalize(pendingTask.requestId, pendingTask);
        return;
      }

      if (!this.beginRefresh(pendingTask.requestId, pendingTask)) {
        this.finalize(pendingTask.requestId, pendingTask);
        return;
      }

      void Promise.resolve()
        .then(() =>
          this.refresh(expectedAreaId, expectedPlayerSnapshot, {
            requestId: pendingTask.requestId,
            signal: pendingTask.controller.signal,
            isCurrentRequest: () => this.isCurrentTask(pendingTask.requestId, pendingTask)
          })
        )
        .catch((error) => {
          if (pendingTask.controller.signal.aborted) {
            return;
          }
          console.error("[MainSceneAreaRefreshCoordinator] refresh failed", {
            requestId: pendingTask.requestId,
            error
          });
        })
        .finally(() => {
          const finishedOwnedRefresh = this.finishRefresh(pendingTask.requestId);

          if (pendingTask.controller.signal.aborted && !finishedOwnedRefresh) {
            return;
          }

          if (!this.canAccessSceneRuntime()) {
            return;
          }

          if (this.isCurrentTask(pendingTask.requestId, pendingTask)) {
            this.finalize(pendingTask.requestId, pendingTask);
          }
        });
    });
  }

  private beginRefresh(
    requestId: number,
    pendingTask: Pick<PendingAreaRefreshTask, "timer">
  ): boolean {
    if (!this.canAccessSceneRuntime() || !this.isCurrentTask(requestId, pendingTask)) {
      return false;
    }

    this.runningRequestId = requestId;
    this.isRefreshRunning = true;
    return true;
  }

  private finishRefresh(requestId: number): boolean {
    if (this.runningRequestId !== requestId) {
      return false;
    }

    this.runningRequestId = undefined;
    this.isRefreshRunning = false;
    return true;
  }

  private canAccessSceneRuntime(): boolean {
    if (this.isDisposed) {
      return false;
    }

    const sceneSys = this.scene.sys as Phaser.Scenes.Systems & {
      isDestroyed?: () => boolean;
    };

    if (!sceneSys) {
      return false;
    }

    if (typeof sceneSys.isDestroyed === "function" && sceneSys.isDestroyed()) {
      return false;
    }

    return Boolean(this.scene.time);
  }

  private cancelRunningRefresh(requestId: number): void {
    this.finishRefresh(requestId);
  }
}
