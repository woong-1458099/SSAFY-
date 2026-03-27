const cache = new Map<number, Promise<unknown>>();

function normalizeWeek(week: number): number {
  return Math.max(1, Math.min(6, Math.round(week)));
}

function getFixedEventUrl(week: number): string {
  return `/assets/game/data/story/fixedevent/fixed_week${normalizeWeek(week)}.json`;
}

let romanceCache: Promise<any[]> | null = null;

async function loadRomanceData(): Promise<any[]> {
  if (romanceCache) return romanceCache;
  romanceCache = Promise.all([
    fetch('/assets/game/data/story/fixedevent/romance_minsu_events.json')
      .then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/assets/game/data/story/fixedevent/romance_hyo_events.json')
      .then(r => r.ok ? r.json() : null).catch(() => null)
  ]);
  return romanceCache;
}

export async function loadFixedEventWeek(week: number): Promise<unknown> {
  const normalizedWeek = normalizeWeek(week);
  const existing = cache.get(normalizedWeek);
  if (existing) {
    return existing;
  }

  const request = Promise.all([
    fetch(getFixedEventUrl(normalizedWeek)).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load fixed event week ${normalizedWeek}: ${response.status}`);
      }
      return response.json();
    }),
    loadRomanceData()
  ])
    .then(([fixedData, romanceDataList]) => {
      const combined = {
        dialogues: Array.isArray(fixedData.dialogues) ? [...fixedData.dialogues] : (Array.isArray(fixedData) ? [...fixedData] : [])
      };

      romanceDataList.forEach(romanceData => {
        if (romanceData && Array.isArray(romanceData.dialogues)) {
          combined.dialogues.push(...romanceData.dialogues);
        } else if (Array.isArray(romanceData)) {
          combined.dialogues.push(...romanceData);
        }
      });

      return combined;
    })
    .catch((error) => {
      cache.delete(normalizedWeek);
      throw error;
    });

  cache.set(normalizedWeek, request);
  return request;
}
