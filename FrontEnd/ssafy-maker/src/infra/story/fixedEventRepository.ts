const cache = new Map<number, Promise<unknown>>();

function normalizeWeek(week: number): number {
  return Math.max(1, Math.min(6, Math.round(week)));
}

function getFixedEventUrl(week: number): string {
  return `/assets/game/data/story/fixedevent/fixed_week${normalizeWeek(week)}.json`;
}

export async function loadFixedEventWeek(week: number): Promise<unknown> {
  const normalizedWeek = normalizeWeek(week);
  const existing = cache.get(normalizedWeek);
  if (existing) {
    return existing;
  }

  const request = fetch(getFixedEventUrl(normalizedWeek))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load fixed event week ${normalizedWeek}: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      cache.delete(normalizedWeek);
      throw error;
    });

  cache.set(normalizedWeek, request);
  return request;
}
