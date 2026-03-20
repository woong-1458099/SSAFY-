// 배경, NPC, UI 등에서 사용하는 에셋 키 문자열을 한곳에서 관리
export const ASSET_KEYS = {
  background: {
    world: "bg-world",
    downtown: "bg-downtown",
    campus: "bg-campus"
  },
  npc: {
    minsu: "npc-minsu",
    yuna: "npc-yuna",
    guide: "npc-guide"
  }
} as const;
