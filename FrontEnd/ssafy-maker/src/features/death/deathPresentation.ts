import type { AreaId } from "../../common/enums/area";
import { getAreaPresentationLabel } from "../../game/scenes/main/areaPresentation";
import { SCENE_IDS, type SceneId } from "../../game/scripts/scenes/sceneIds";
import type { DeathRecordEvent } from "./deathApi";

const SCENE_LABELS: Partial<Record<SceneId, string>> = {
  [SCENE_IDS.worldDefault]: "기본 거리",
  [SCENE_IDS.downtownDefault]: "번화가",
  [SCENE_IDS.campusDefault]: "캠퍼스",
  [SCENE_IDS.classroomDefault]: "강의실",
  [SCENE_IDS.campusSample]: "캠퍼스 샘플"
};

const DEATH_CAUSE_LABELS: Record<string, string> = {
  HP_ZERO: "체력 고갈"
};

function isAreaId(value: string): value is AreaId {
  return value === "world" || value === "downtown" || value === "campus" || value === "classroom";
}

function normalizeLookupKey(value: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function toDisplayLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDeathCauseLabel(cause: string | null): string {
  if (!cause?.trim()) {
    return "원인 정보 없음";
  }

  return DEATH_CAUSE_LABELS[cause.trim().toUpperCase()] ?? toDisplayLabel(cause);
}

export function formatDeathLocationLabel(areaId: string | null, sceneId: string | null): string {
  const rawAreaId = areaId?.trim() ?? "";
  const rawSceneId = sceneId?.trim() ?? "";
  const normalizedAreaId = normalizeLookupKey(areaId);
  const normalizedSceneId = normalizeLookupKey(sceneId);

  const areaLabel = normalizedAreaId
    ? (isAreaId(normalizedAreaId) ? getAreaPresentationLabel(normalizedAreaId) : toDisplayLabel(normalizedAreaId))
    : "";
  const sceneLabel = normalizedSceneId
    ? SCENE_LABELS[normalizedSceneId as SceneId] ?? toDisplayLabel(normalizedSceneId)
    : "";

  if (areaLabel && sceneLabel) {
    return `${areaLabel} · ${sceneLabel}`;
  }
  if (sceneLabel) {
    return sceneLabel;
  }
  if (areaLabel) {
    return areaLabel;
  }

  if (rawSceneId) {
    return toDisplayLabel(rawSceneId);
  }
  if (rawAreaId) {
    return toDisplayLabel(rawAreaId);
  }

  return "위치 정보 없음";
}

export function formatDeathDashboardLines(entry: Pick<DeathRecordEvent, "areaId" | "sceneId" | "cause">): {
  location: string;
  cause: string;
} {
  return {
    location: `위치: ${formatDeathLocationLabel(entry.areaId, entry.sceneId)}`,
    cause: `원인: ${formatDeathCauseLabel(entry.cause)}`
  };
}
