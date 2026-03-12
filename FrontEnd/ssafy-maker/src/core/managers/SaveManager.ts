type SaveData = {
  version: number;
  payload: Record<string, unknown>;
};

export class SaveManager {
  private readonly saveKey = "ssafy_trainee_raising_save";

  save(payload: Record<string, unknown>): void {
    const data: SaveData = {
      version: 1,
      payload
    };
    localStorage.setItem(this.saveKey, JSON.stringify(data));
  }

  load(): SaveData | null {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }
}

