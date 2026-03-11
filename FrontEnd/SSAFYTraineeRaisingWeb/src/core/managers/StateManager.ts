export class StateManager {
  private state = new Map<string, unknown>();

  set<T>(key: string, value: T): void {
    this.state.set(key, value);
  }

  get<T>(key: string, fallback: T): T {
    if (!this.state.has(key)) return fallback;
    return this.state.get(key) as T;
  }

  clear(): void {
    this.state.clear();
  }
}

