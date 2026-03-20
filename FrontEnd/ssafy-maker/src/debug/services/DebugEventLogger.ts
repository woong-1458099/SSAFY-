export class DebugEventLogger {
  private events: string[] = [];
  private currentSceneId = "";
  private currentAction = "";

  log(message: string) {
    this.events.unshift(message);
    this.events = this.events.slice(0, 20);
  }

  setAction(sceneId: string, actionIndex: number, actionType: string) {
    this.currentSceneId = sceneId;
    this.currentAction = `${actionIndex}: ${actionType}`;
    this.log(`action:${sceneId}:${this.currentAction}`);
  }

  getState() {
    return {
      currentSceneId: this.currentSceneId,
      currentAction: this.currentAction,
      events: this.events
    };
  }
}
