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
  private pendingHandler?: () => void;
  private pendingEventName?: string;
  private pendingRequestId = 0;

  constructor(options: AreaRefreshCoordinatorOptions) {
    this.scene = options.scene;
    this.refresh = options.refresh;
    this.canRefresh = options.canRefresh;
  }

  getRequestId(): number {
    return this.pendingRequestId;
  }

  queue(expectedAreaId: AreaId, expectedPlayerSnapshot?: { tileX: number; tileY: number }): void {
    this.clear();
    const requestId = this.pendingRequestId;
    const eventName = Phaser.Scenes.Events.RENDER;

    const handler = () => {
      try {
        if (this.pendingRequestId !== requestId || !this.canRefresh()) {
          return;
        }

        this.refresh(expectedAreaId, expectedPlayerSnapshot, requestId);
      } finally {
        this.finalize(requestId);
      }
    };

    this.pendingEventName = eventName;
    this.pendingHandler = handler;
    this.scene.events.once(eventName, handler);
  }

  clear(): void {
    this.finalize();
  }

  finalize(requestId?: number): void {
    const activeRequestId = this.pendingRequestId;
    if (requestId !== undefined && requestId !== activeRequestId) {
      return;
    }

    if (this.pendingEventName) {
      this.scene.events.off(this.pendingEventName, this.pendingHandler);
    }

    this.pendingHandler = undefined;
    this.pendingEventName = undefined;
    this.pendingRequestId = activeRequestId + 1;
  }
}
