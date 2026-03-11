import Phaser from "phaser";

class EventBusClass {
  private emitter = new Phaser.Events.EventEmitter();

  on<T = unknown>(event: string, callback: (payload: T) => void, context?: unknown): void {
    this.emitter.on(event, callback as (...args: unknown[]) => void, context);
  }

  once<T = unknown>(event: string, callback: (payload: T) => void, context?: unknown): void {
    this.emitter.once(event, callback as (...args: unknown[]) => void, context);
  }

  off(event: string, callback?: (...args: unknown[]) => void, context?: unknown): void {
    this.emitter.off(event, callback, context);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    this.emitter.emit(event, payload);
  }

  removeAll(event?: string): void {
    this.emitter.removeAllListeners(event);
  }
}

export const EventBus = new EventBusClass();

