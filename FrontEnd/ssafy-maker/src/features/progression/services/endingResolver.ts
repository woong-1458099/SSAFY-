import type {
  EndingComicPanel,
  EndingFlowPayload,
  EndingId,
  EndingImageAsset,
  EndingResult,
  EndingSummaryStat
} from "@features/progression/types/ending";

type EndingDefinition = {
  endingId: EndingId;
  title: string;
  priority: number;
  triggerMode: "manual" | "immediate";
  presentationMode: "full" | "summaryOnly";
  shortDescription: string;
  introLines: string[];
  npcLine: string;
  dominantLabels: string[];
  comicPanels: EndingComicPanel[];
  imageFiles: string[];
  matches: (input: EndingFlowPayload) => boolean;
};

const PANEL_ACCENTS = [0x6ab8ff, 0x73d3ff, 0x8fe0ff, 0x9ce7e3];

const ENDING_DEFINITIONS: EndingDefinition[] = [
  createEndingDefinition({
    endingId: "lotto",
    title: "로또 엔딩",
    priority: 110,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "1등 당첨으로 졸업보다 빠르게 인생 역전 루트에 진입했습니다.",
    dominantLabels: ["로또", "행운", "역전"],
    imageFiles: createPanelFileNames("ending_lotto_panel"),
    matches: (input) => input.lottoRank === 1
  }),
  createEndingDefinition({
    endingId: "game_over",
    title: "게임 오버",
    priority: 100,
    triggerMode: "immediate",
    presentationMode: "summaryOnly",
    shortDescription: "체력이 바닥나면서 이번 학기의 도전이 여기서 멈췄습니다.",
    dominantLabels: ["HP", "한계", "실패"],
    imageFiles: ["ending_yamuchi.png"],
    matches: (input) => input.hp <= 0
  }),
  createEndingDefinition({
    endingId: "runaway",
    title: "탈주닌자 엔딩",
    priority: 95,
    triggerMode: "immediate",
    presentationMode: "summaryOnly",
    shortDescription: "스트레스가 한계를 넘기면서 모든 일정에서 이탈해 버렸습니다.",
    dominantLabels: ["스트레스", "이탈", "한계"],
    imageFiles: createPanelFileNames("ending_runaway_panel"),
    matches: (input) => input.stress >= 100
  }),
  createEndingDefinition({
    endingId: "largecompany",
    title: "대기업 엔딩",
    priority: 90,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "기술력과 협업 능력을 모두 인정받아 대기업 합격 루트에 도달했습니다.",
    dominantLabels: ["FE", "BE", "협업"],
    imageFiles: createPanelFileNames("ending_largecompany_panel"),
    matches: (input) => input.fe >= 150 && input.be >= 150 && input.teamwork >= 150
  }),
  createEndingDefinition({
    endingId: "lucky_job",
    title: "운빨 취업 엔딩",
    priority: 85,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "결정적인 순간마다 운이 따라주면서 예상 밖의 취업 기회를 잡았습니다.",
    dominantLabels: ["운", "기회", "취업"],
    imageFiles: createPanelFileNames("ending_luckyjob_panel"),
    matches: (input) => input.luck >= 180
  }),
  createEndingDefinition({
    endingId: "gamer",
    title: "게이머 엔딩",
    priority: 80,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "게임에 쏟은 시간이 결국 또 다른 진로의 문을 열어 주었습니다.",
    dominantLabels: ["게임", "취미", "몰입"],
    imageFiles: createPanelFileNames("ending_gamer_panel"),
    matches: (input) => input.gamePlayCount >= 15
  }),
  createEndingDefinition({
    endingId: "frontend_master",
    title: "FE 개발자 엔딩",
    priority: 60,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "프론트엔드 구현 역량이 정점에 도달해 UI와 사용자 경험을 이끄는 개발자가 되었습니다.",
    dominantLabels: ["FE", "UI", "구현"],
    imageFiles: createPanelFileNames("ending_fe_panel"),
    matches: (input) => input.fe >= 250
  }),
  createEndingDefinition({
    endingId: "backend_master",
    title: "BE 개발자 엔딩",
    priority: 59,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "백엔드 구조와 데이터 설계 역량이 충분히 쌓여 안정적인 서버 개발 루트에 올랐습니다.",
    dominantLabels: ["BE", "서버", "구조"],
    imageFiles: [],
    matches: (input) => input.be >= 200
  }),
  createEndingDefinition({
    endingId: "collaborative_dev",
    title: "협업형 개발자 엔딩",
    priority: 58,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "기술과 커뮤니케이션을 함께 챙기며 팀에 필요한 개발자로 성장했습니다.",
    dominantLabels: ["협업", "FE", "BE"],
    imageFiles: createPanelFileNames("ending_teamplayer_panel"),
    matches: (input) => input.teamwork >= 200 && input.fe >= 150 && input.be >= 150
  }),
  createEndingDefinition({
    endingId: "leader_type",
    title: "리더형 엔딩",
    priority: 57,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "팀을 이끌고 방향을 정리하는 역할에 강점을 보이며 리더형 인재로 자리 잡았습니다.",
    dominantLabels: ["협업", "리더십", "조율"],
    imageFiles: createPanelFileNames("ending_leader_panel"),
    matches: (input) => input.teamwork >= 250
  }),
  createEndingDefinition({
    endingId: "health_trainer",
    title: "헬스트레이너 엔딩",
    priority: 50,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "체력 관리와 꾸준함이 극한까지 올라가 완전히 다른 진로를 보여 주었습니다.",
    dominantLabels: ["HP MAX", "체력", "꾸준함"],
    imageFiles: createPanelFileNames("ending_healthutuber_panel"),
    matches: (input) => input.hpMax >= 200
  }),
  createEndingDefinition({
    endingId: "normal",
    title: "노말 엔딩",
    priority: 0,
    triggerMode: "manual",
    presentationMode: "full",
    shortDescription: "눈에 띄는 특화 엔딩은 아니지만, 6주 동안의 성장을 무사히 완주했습니다.",
    dominantLabels: ["완주", "성장", "기본"],
    imageFiles: createPanelFileNames("ending_nomal_panel"),
    matches: () => true
  })
].sort((left, right) => right.priority - left.priority);

export type { EndingId, EndingComicPanel, EndingResult };

export function resolveEnding(input: EndingFlowPayload): EndingResult {
  const summaryStats: EndingSummaryStat[] = [
    { key: "fe", label: "FE", value: Math.round(input.fe) },
    { key: "be", label: "BE", value: Math.round(input.be) },
    { key: "teamwork", label: "TEAM", value: Math.round(input.teamwork) },
    { key: "luck", label: "LUCK", value: Math.round(input.luck) },
    { key: "hp", label: "HP", value: Math.round(input.hp) },
    { key: "hpMax", label: "HP MAX", value: Math.round(input.hpMax) },
    { key: "stress", label: "STRESS", value: Math.round(input.stress) },
    { key: "gamePlayCount", label: "GAME", value: Math.round(input.gamePlayCount) }
  ];

  const definition = ENDING_DEFINITIONS.find((candidate) => candidate.matches(input)) ?? ENDING_DEFINITIONS[ENDING_DEFINITIONS.length - 1];
  const comicImages = definition.imageFiles.map((fileName, index) =>
    buildEndingImageAsset(definition.endingId, fileName, `panel-${index + 1}`)
  );

  return {
    endingId: definition.endingId,
    title: definition.title,
    priority: definition.priority,
    triggerMode: definition.triggerMode,
    presentationMode: definition.presentationMode,
    shortDescription: definition.shortDescription,
    summaryStats,
    introLines: definition.introLines,
    npcLine: definition.npcLine,
    comicPanels: definition.comicPanels,
    dominantLabels: definition.dominantLabels,
    previewImage: comicImages[0],
    introImage: comicImages[1] ?? comicImages[0],
    comicImages
  };
}

function createEndingDefinition(input: {
  endingId: EndingId;
  title: string;
  priority: number;
  triggerMode: "manual" | "immediate";
  presentationMode: "full" | "summaryOnly";
  shortDescription: string;
  dominantLabels: string[];
  imageFiles: string[];
  matches: (input: EndingFlowPayload) => boolean;
}): EndingDefinition {
  return {
    ...input,
    introLines: [
      `${input.title} 조건이 최종 결과로 확정되었습니다.`,
      input.shortDescription,
      "이번 플레이에서 쌓은 선택과 결과가 이 결말로 이어졌습니다."
    ],
    npcLine: `${input.title} 루트가 기록되었습니다. 다음에는 다른 결말도 노려볼 수 있습니다.`,
    comicPanels: createFallbackComicPanels(input.title, input.shortDescription, input.dominantLabels)
  };
}

function createFallbackComicPanels(title: string, shortDescription: string, dominantLabels: string[]): EndingComicPanel[] {
  return [
    {
      id: "panel-1",
      title: `${title} 도달`,
      body: shortDescription,
      accentColor: PANEL_ACCENTS[0]
    },
    {
      id: "panel-2",
      title: "핵심 키워드",
      body: dominantLabels.join(" / "),
      accentColor: PANEL_ACCENTS[1]
    },
    {
      id: "panel-3",
      title: "6주 기록",
      body: "플레이어의 누적 선택이 엔딩 결과에 반영되었습니다.",
      accentColor: PANEL_ACCENTS[2]
    },
    {
      id: "panel-4",
      title: "다음 루트",
      body: "다른 스탯 분배와 이벤트 선택으로 새로운 결말을 확인할 수 있습니다.",
      accentColor: PANEL_ACCENTS[3]
    }
  ];
}

function createPanelFileNames(prefix: string): string[] {
  return [1, 2, 3, 4].map((index) => `${prefix}_${String(index).padStart(2, "0")}.png`);
}

function buildEndingImageAsset(endingId: EndingId, fileName: string, slot: string): EndingImageAsset {
  return {
    key: `ending:${endingId}:${slot}:${fileName.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    path: `/assets/game/ending/${fileName}`,
    label: fileName
  };
}
