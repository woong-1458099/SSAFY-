export const PORTRAIT_FRAME_CONFIG = {
  frameWidth: 320,
  frameHeight: 320,
  neutralFrame: 2
} as const;

export type DialoguePortraitId =
  | "minsu"
  | "myungjin"
  | "jongmin"
  | "hyoryeon"
  | "jiwoo"
  | "yeonwoong";

export type DialoguePortraitDefinition = {
  id: DialoguePortraitId;
  textureKey: string;
  assetPath: string;
  aliases: string[];
};

function createPortraitDefinition(
  id: DialoguePortraitId,
  assetPath: string,
  aliases: string[]
): DialoguePortraitDefinition {
  return {
    id,
    textureKey: `portrait-${id}`,
    assetPath,
    aliases
  };
}

export const PORTRAIT_ASSET_CATALOG: Record<DialoguePortraitId, DialoguePortraitDefinition> = {
  minsu: createPortraitDefinition("minsu", "/assets/game/portrait/minsu_pt.png", ["민수", "김민수", "npc_minsu", "minsu"]),
  myungjin: createPortraitDefinition("myungjin", "/assets/game/portrait/myungjin_pt.png", ["명진", "김명진", "npc_myungjin", "myungjin"]),
  jongmin: createPortraitDefinition("jongmin", "/assets/game/portrait/jongmin_pt.png", ["종민", "진종민", "npc_jongmin", "jongmin"]),
  hyoryeon: createPortraitDefinition("hyoryeon", "/assets/game/portrait/hyoryeon_pt.png", ["효련", "종효련", "npc_hyoryeon", "hyoryeon"]),
  jiwoo: createPortraitDefinition("jiwoo", "/assets/game/portrait/jiwoo_pt.png", ["지우", "하지우", "npc_jiwoo", "jiwoo"]),
  yeonwoong: createPortraitDefinition("yeonwoong", "/assets/game/portrait/yeonwoong_pt.png", ["연웅", "최연웅", "npc_yeonwoong", "yeonwoong", "woong"])
};

export const PORTRAIT_ASSET_LIST = Object.values(PORTRAIT_ASSET_CATALOG);

const PORTRAIT_ALIAS_MAP = new Map<string, DialoguePortraitDefinition>();

PORTRAIT_ASSET_LIST.forEach((portrait) => {
  portrait.aliases.forEach((alias) => {
    PORTRAIT_ALIAS_MAP.set(normalizePortraitToken(alias), portrait);
  });
});

function normalizePortraitToken(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, "").trim().toLowerCase();
}

export function resolveDialoguePortraitDefinition(speakerId?: string, speakerName?: string): DialoguePortraitDefinition | null {
  const candidates = [speakerId, speakerName];

  for (const candidate of candidates) {
    const normalized = normalizePortraitToken(candidate);
    if (!normalized) {
      continue;
    }

    const portrait = PORTRAIT_ALIAS_MAP.get(normalized);
    if (portrait) {
      return portrait;
    }
  }

  return null;
}

export function resolveDialoguePortraitFrame(emotion?: string, portrait?: DialoguePortraitDefinition | null): number {
  const normalized = (emotion ?? "").trim().toUpperCase();

  switch (normalized) {
    case "WINK":
      return 0;
    case "HAPPY":
    case "SMILE":
      return 1;
    default:
      return PORTRAIT_FRAME_CONFIG.neutralFrame;
  }
}
