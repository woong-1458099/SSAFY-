import {
  isDeprecatedMinigameSceneKey,
  type LegacyMinigameSceneKey
} from "./minigameSceneKeys";

export type MinigameHowToPlay = {
  instructions: string[];
  controls: string[];
  tips?: string[];
};

export type LegacyMinigameCard = {
  key: LegacyMinigameSceneKey;
  title: string;
  sub: string;
  desc: string;
  reward: string;
  bgColor: number;
  borderColor: number;
  glowColor: number;
  howToPlay?: MinigameHowToPlay;
};

export function collectDeprecatedCardKeys(cards: readonly LegacyMinigameCard[]): LegacyMinigameSceneKey[] {
  return cards
    .map((card) => card.key)
    .filter((key) => isDeprecatedMinigameSceneKey(key));
}

export function assertMinigameCatalogIntegrity(cards: readonly LegacyMinigameCard[]): void {
  const deprecatedCardKeys = collectDeprecatedCardKeys(cards);

  if (deprecatedCardKeys.length > 0) {
    throw new Error(
      `[minigameCatalog] deprecated scene key가 카드 목록에 남아 있습니다: ${deprecatedCardKeys.join(", ")}`
    );
  }
}

export const LEGACY_MINIGAME_CARDS: readonly LegacyMinigameCard[] = [
  {
    key: "QuizScene",
    title: "퀴즈",
    sub: "알고리즘 / CS 문제",
    desc: "15초 / 5문제",
    reward: "BE +2~+6, TEAMWORK +0~+2",
    bgColor: 0x001888,
    borderColor: 0x4499ff,
    glowColor: 0x0033cc,
    howToPlay: {
      instructions: ["문제를 읽고 정답을 고르세요", "제한 시간 안에 5문제를 풉니다"],
      controls: ["마우스로 보기 선택"]
    }
  },
  {
    key: "RhythmScene",
    title: "리듬",
    sub: "타이밍 입력",
    desc: "A / W / J / I",
    reward: "FE +2~+8, TEAMWORK +1~+4",
    bgColor: 0x005518,
    borderColor: 0x33ff88,
    glowColor: 0x007722,
    howToPlay: {
      instructions: ["노트가 판정선에 오면 키를 누르세요", "정확도가 높을수록 더 좋은 보상을 받습니다"],
      controls: ["A, W, J, I"]
    }
  },
  {
    key: "TankScene",
    title: "탱크",
    sub: "적 탱크 격파",
    desc: "생존 및 승리",
    reward: "FE +1~+7, TEAMWORK +3~+5 / 패배 시 STRESS +4",
    bgColor: 0x332200,
    borderColor: 0x88ff00,
    glowColor: 0x443300,
    howToPlay: {
      instructions: ["적 탱크를 모두 격파하세요", "피격되면 체력이 줄어듭니다"],
      controls: ["마우스로 조준", "클릭으로 발사"]
    }
  },
  {
    key: "RunnerScene",
    title: "러너",
    sub: "장애물 점프",
    desc: "생존형",
    reward: "LUCK +1~+6, TEAMWORK +0~+3",
    bgColor: 0x003322,
    borderColor: 0x33ffcc,
    glowColor: 0x006644,
    howToPlay: {
      instructions: ["장애물을 피해 달리세요", "오래 버틸수록 더 높은 보상을 받습니다"],
      controls: ["Space 점프"]
    }
  },
  {
    key: "TypingScene",
    title: "타이핑",
    sub: "코드 타이핑 챌린지",
    desc: "빠르고 정확하게",
    reward: "FE +5, GP +15",
    bgColor: 0x1a1a2e,
    borderColor: 0x00ff88,
    glowColor: 0x0f3460,
    howToPlay: {
      instructions: ["화면에 나타나는 코드를 타이핑하세요", "정확도와 속도가 중요합니다"],
      controls: ["키보드 타이핑"]
    }
  },
  {
    key: "BusinessSmileScene",
    title: "비즈니스 미소",
    sub: "표정 인식 챌린지",
    desc: "미소 게이지 채우기",
    reward: "협업 +4",
    bgColor: 0x003455,
    borderColor: 0x48d4ff,
    glowColor: 0x0d5c84,
    howToPlay: {
      instructions: ["카메라를 보고 웃으세요", "게이지를 끝까지 채우면 성공입니다"],
      controls: ["표정 인식"],
      tips: ["카메라 권한이 필요합니다"]
    }
  },
  {
    key: "DontSmileScene",
    title: "웃음 참기",
    sub: "표정 유지 챌린지",
    desc: "끝까지 버티기",
    reward: "STRESS -5",
    bgColor: 0x4d1020,
    borderColor: 0xff6a88,
    glowColor: 0x6d1830,
    howToPlay: {
      instructions: ["웃지 말고 버티세요", "웃으면 실패합니다"],
      controls: ["표정 인식"],
      tips: ["카메라 권한이 필요합니다"]
    }
  },
  {
    key: "GymScene",
    title: "헬스장",
    sub: "스페이스 연타",
    desc: "15회 / 30초",
    reward: "HPMAX +1~+6, TEAMWORK +0~+3",
    bgColor: 0x1a0800,
    borderColor: 0xff8800,
    glowColor: 0x332200,
    howToPlay: {
      instructions: ["스페이스바를 빠르게 누르세요", "제한 시간 안에 목표 횟수를 채웁니다"],
      controls: ["Space 연타"]
    }
  },
  {
    key: "CookingScene",
    title: "라멘 달인",
    sub: "재료 받기",
    desc: "30초 / 캐치",
    reward: "HP +2~+10, TEAMWORK +0~+4 / 실패 시 STRESS +4",
    bgColor: 0x442211,
    borderColor: 0xff8822,
    glowColor: 0x663311,
    howToPlay: {
      instructions: ["떨어지는 재료를 받으세요", "제한 시간 동안 최대한 많이 모읍니다"],
      controls: ["좌우 이동"]
    }
  },
  {
    key: "LottoScene",
    title: "SSAFY Lotto",
    sub: "당첨금 가챠",
    desc: "확률 테스트",
    reward: "0 / +5,000 / +15,000 / +50,000 / +200,000 / 1등 엔딩",
    bgColor: 0x001133,
    borderColor: 0xffff00,
    glowColor: 0x002244,
    howToPlay: {
      instructions: ["버튼을 눌러 결과를 확인하세요", "낮은 확률로 큰 보상을 얻을 수 있습니다"],
      controls: ["마우스 클릭"]
    }
  },
  {
    key: "InterviewScene",
    title: "TECH INTERVIEW",
    sub: "기술 면접 대비",
    desc: "15SEC / 5 QUESTIONS",
    reward: "BE +2~+6, TEAMWORK +0~+2 / 실패 시 STRESS +4",
    bgColor: 0x1a0033,
    borderColor: 0xffd700,
    glowColor: 0x330066,
    howToPlay: {
      instructions: ["질문을 읽고 정답을 고르세요", "제한 시간 안에 최대한 많이 맞히세요"],
      controls: ["마우스로 선택"]
    }
  },
  {
    key: "DrinkingScene",
    title: "주점 미니게임",
    sub: "거품 조절 챌린지",
    desc: "5 ROUNDS / BEER",
    reward: "TEAMWORK +1~+4, STRESS -0~-6",
    bgColor: 0x221100,
    borderColor: 0xffaa00,
    glowColor: 0x442200,
    howToPlay: {
      instructions: ["맥주를 따르세요", "거품이 넘치지 않게 조절하세요", "총 5라운드 진행"],
      controls: ["Space로 따르기"]
    }
  }
];

export function getMinigameCard(sceneKey: string): LegacyMinigameCard | undefined {
  return LEGACY_MINIGAME_CARDS.find((card) => card.key === sceneKey);
}
