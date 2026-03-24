export const FIXED_EVENT_LOCATION_ALIASES: Record<string, string[]> = {
  campus: ["캠퍼스", "캠퍼스 내부", "캠퍼스내부", "강의장", "강의동", "강의실", "실습장", "휴게실", "inssafy"],
  downtown: ["번화가", "시내", "city"],
  world: ["전체지도", "전체 지도", "월드", "맵", "map"],
  home: ["집", "자취방", "기숙사", "home"],
  cafe: ["카페", "cafe"],
  store: ["편의점", "store"]
};

export function normalizeFixedEventLocationToken(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/[()[\]{}]/g, "");
}

export function matchesFixedEventLocation(rawLocation: unknown, currentLocation: string): boolean {
  const location = normalizeFixedEventLocationToken(rawLocation);
  const current = normalizeFixedEventLocationToken(currentLocation);

  if (!location) return true;
  if (!current) return false;
  if (location === current) return true;

  return Object.entries(FIXED_EVENT_LOCATION_ALIASES).some(([canonical, aliases]) => {
    const normalizedValues = [canonical, ...aliases].map(normalizeFixedEventLocationToken);
    return normalizedValues.includes(location) && normalizedValues.includes(current);
  });
}
