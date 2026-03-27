const GA_MEASUREMENT_ID = "G-CZY3HL1D22";
const GA_SCRIPT_ID = "ga4-base-script";
const GA_HOSTNAME_SUFFIX = "ssafymaker.cloud";

type GtagCommand = "js" | "config" | "event" | "set";

type AnalyticsEventMap = {
  game_start: {
    week: number;
    authenticated: boolean;
  };
  minigame_start: {
    minigame_id: string;
    launch_source: "menu" | "gateway";
    return_scene_key?: string;
  };
  ending_complete: {
    ending_id: string;
    week: number;
    game_play_count: number;
  };
  weekly_progress_snapshot: {
    week: number;
    money: number;
    fe: number;
    be: number;
    teamwork: number;
    luck: number;
    hp: number;
    stress: number;
    game_play_count: number;
  };
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsReady = false;
let analyticsEnabled = false;
let currentUserId: string | null = null;
let trackedWeeklySnapshots = new Set<number>();

function isProductionAnalyticsEnvironment(): boolean {
  if (!import.meta.env.PROD) {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return hostname === GA_HOSTNAME_SUFFIX || hostname.endsWith(`.${GA_HOSTNAME_SUFFIX}`);
}

function ensureDataLayer(): void {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

function gtag(command: GtagCommand, ...args: unknown[]): void {
  if (!analyticsEnabled || typeof window.gtag !== "function") {
    return;
  }

  window.gtag(command, ...args);
}

function syncUserId(): void {
  if (!analyticsReady) {
    return;
  }

  const config: Record<string, unknown> = {
    send_page_view: false
  };

  if (currentUserId) {
    config.user_id = currentUserId;
  }

  gtag("config", GA_MEASUREMENT_ID, config);
}

export function initializeAnalytics(): boolean {
  analyticsEnabled = isProductionAnalyticsEnvironment();
  if (!analyticsEnabled) {
    return false;
  }

  ensureDataLayer();

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  gtag("js", new Date());
  analyticsReady = true;
  syncUserId();
  return true;
}

export function setAnalyticsUserId(userId: string | null | undefined): void {
  currentUserId = typeof userId === "string" && userId.trim().length > 0 ? userId.trim() : null;
  syncUserId();
}

export function trackAnalyticsEvent<EventName extends keyof AnalyticsEventMap>(
  eventName: EventName,
  params: AnalyticsEventMap[EventName]
): void {
  if (!analyticsReady) {
    return;
  }

  gtag("event", eventName, params);
}

export function trackGameStart(params: AnalyticsEventMap["game_start"]): void {
  trackedWeeklySnapshots = new Set<number>();
  trackAnalyticsEvent("game_start", params);
}

export function trackWeeklyProgressSnapshot(params: AnalyticsEventMap["weekly_progress_snapshot"]): void {
  if (trackedWeeklySnapshots.has(params.week)) {
    return;
  }

  trackedWeeklySnapshots.add(params.week);
  trackAnalyticsEvent("weekly_progress_snapshot", params);
}
