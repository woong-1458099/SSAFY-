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
    throw new Error(`[minigameCatalog] deprecated scene key가 카드 목록에 남아 있습니다: ${deprecatedCardKeys.join(", ")}`);
  }
}

export const LEGACY_MINIGAME_CARDS: readonly LegacyMinigameCard[] = [
  {
    key: "QuizScene",
    title: "퀴즈",
    sub: "알고리즘 / CS 문제",
    desc: "15초 / 5문제",
    reward: "BE +5, GP +15",
    bgColor: 0x001888,
    borderColor: 0x4499ff,
    glowColor: 0x0033cc,
    howToPlay: {
      instructions: ["문제를 읽고 정답을 선택하세요", "제한 시간: 15초", "총 5문제"],
      controls: ["마우스 클릭으로 선택지 선택"]
    }
  },
  {
    key: "RhythmScene",
    title: "리듬",
    sub: "키보드 리듬 입력",
    desc: "A W J I",
    reward: "FE +4, GP +10",
    bgColor: 0x005518,
    borderColor: 0x33ff88,
    glowColor: 0x007722,
    howToPlay: {
      instructions: ["노트가 판정선에 도달하면 키 입력", "타이밍에 맞춰 정확히 입력하세요"],
      controls: ["A, W, J, I 키 사용"]
    }
  },
  {
    key: "TankScene",
    title: "탱크 워",
    sub: "적 탱크 파괴",
    desc: "생존 및 섬멸",
    reward: "FE +5, GP +20",
    bgColor: 0x332200,
    borderColor: 0x88ff00,
    glowColor: 0x443300,
    howToPlay: {
      instructions: ["적 탱크를 모두 파괴하세요", "피격당하면 체력이 감소합니다"],
      controls: ["마우스로 조준", "클릭으로 발사"]
    }
  },
  {
    key: "RunnerScene",
    title: "러너",
    sub: "장애물 점프",
    desc: "생존전",
    reward: "LUCK +5, GP +15",
    bgColor: 0x003322,
    borderColor: 0x33ffcc,
    glowColor: 0x006644,
    howToPlay: {
      instructions: ["장애물을 피해 달리세요", "오래 버틸수록 높은 점수"],
      controls: ["스페이스바로 점프"]
    }
  },
  // 타이핑 게임(TypingScene) - 현재 비활성화됨
  {
    key: "BusinessSmileScene",
    title: "비즈니스 미소",
    sub: "미소 게이지 채우기",
    desc: "표정 인식",
    reward: "협업 +4, GP +10",
    bgColor: 0x003455,
    borderColor: 0x48d4ff,
    glowColor: 0x0d5c84,
    howToPlay: {
      instructions: ["카메라를 보고 미소를 지으세요", "미소 게이지를 채우면 성공"],
      controls: ["웃는 표정 유지"],
      tips: ["카메라 권한이 필요합니다"]
    }
  },
  {
    key: "DontSmileScene",
    title: "웃음 참기",
    sub: "표정 제어 챌린지",
    desc: "끝까지 버티기",
    reward: "STRESS -5, GP +10",
    bgColor: 0x4d1020,
    borderColor: 0xff6a88,
    glowColor: 0x6d1830,
    howToPlay: {
      instructions: ["웃음을 참으세요!", "웃으면 게임 오버"],
      controls: ["무표정 유지"],
      tips: ["카메라 권한이 필요합니다"]
    }
  },
  {
    key: "GymScene",
    title: "헬스장",
    sub: "스페이스 연타",
    desc: "15렙 / 30초",
    reward: "HP +5, GP +15",
    bgColor: 0x1a0800,
    borderColor: 0xff8800,
    glowColor: 0x332200,
    howToPlay: {
      instructions: ["스페이스바를 연타하세요", "제한 시간 내 목표 달성", "15레벨까지 도전"],
      controls: ["스페이스바 연타"]
    }
  },
  {
    key: "CookingScene",
    title: "라면 장인",
    sub: "재료 받기",
    desc: "30초 / 캐치",
    reward: "HP +7, GP +20",
    bgColor: 0x442211,
    borderColor: 0xff8822,
    glowColor: 0x663311,
    howToPlay: {
      instructions: ["떨어지는 재료를 받으세요", "제한 시간: 30초", "폭탄은 피하세요!"],
      controls: ["← → 방향키로 이동"]
    }
  },
  {
    key: "LottoScene",
    title: "SSAFY 로또",
    sub: "일확천금 가챠",
    desc: "운빨 테스트",
    reward: "GP +10,000 (1등)",
    bgColor: 0x001133,
    borderColor: 0xffff00,
    glowColor: 0x002244,
    howToPlay: {
      instructions: ["운에 맡기세요!", "1등 당첨시 GP +10,000"],
      controls: ["버튼 클릭으로 뽑기"]
    }
  },
  {
    key: "InterviewScene",
    title: "TECH INTERVIEW",
    sub: "기술 면접 대비",
    desc: "15SEC / 5 QUESTIONS",
    reward: "BE +5, GP +15",
    bgColor: 0x1a0033,
    borderColor: 0xFFD700,
    glowColor: 0x330066,
    howToPlay: {
      instructions: ["기술 면접 질문에 답하세요", "제한 시간: 15초", "총 5문제"],
      controls: ["마우스 클릭으로 답변 선택"]
    }
  },
  {
    key: "DrinkingScene",
    title: "할맥 부어라 마시기",
    sub: "거품 조절 챌린지",
    desc: "5 ROUNDS / BEER",
    reward: "STRESS -5, GP +10",
    bgColor: 0x221100,
    borderColor: 0xffaa00,
    glowColor: 0x442200,
    howToPlay: {
      instructions: ["맥주를 따르세요", "거품이 넘치지 않게 조절", "총 5라운드"],
      controls: ["스페이스바로 맥주 따르기"]
    }
  }
];

export function getMinigameCard(sceneKey: string): LegacyMinigameCard | undefined {
  return LEGACY_MINIGAME_CARDS.find((card) => card.key === sceneKey);
}
