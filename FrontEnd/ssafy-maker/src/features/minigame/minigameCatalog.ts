import {
  isDeprecatedMinigameSceneKey,
  type LegacyMinigameSceneKey
} from "./minigameSceneKeys";

export type LegacyMinigameCard = {
  key: LegacyMinigameSceneKey;
  title: string;
  sub: string;
  desc: string;
  reward: string;
  bgColor: number;
  borderColor: number;
  glowColor: number;
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
    reward: "지능 +10, 골드 +30",
    bgColor: 0x001888,
    borderColor: 0x4499ff,
    glowColor: 0x0033cc
  },
  {
    key: "RhythmScene",
    title: "리듬",
    sub: "키보드 리듬 입력",
    desc: "A W J I",
    reward: "집중 +7, 골드 +20",
    bgColor: 0x005518,
    borderColor: 0x33ff88,
    glowColor: 0x007722
  },
  {
    key: "TankScene",
    title: "탱크 워",
    sub: "적 탱크 파괴",
    desc: "생존 및 섬멸",
    reward: "집중 +10, 골드 +40",
    bgColor: 0x332200,
    borderColor: 0x88ff00,
    glowColor: 0x443300
  },
  {
    key: "RunnerScene",
    title: "러너",
    sub: "장애물 점프",
    desc: "생존전",
    reward: "민첩 +7, 골드 +20",
    bgColor: 0x003322,
    borderColor: 0x33ffcc,
    glowColor: 0x006644
  },

  {
    key: "TypingScene",
    title: "타이핑",
    sub: "코드 타이핑",
    desc: "20초 / 입력",
    reward: "지능 +5, 골드 +10",
    bgColor: 0x0d2a1a,
    borderColor: 0x44ff88,
    glowColor: 0x116633
  },
  {
    key: "BusinessSmileScene",
    title: "비즈니스 미소",
    sub: "미소 게이지 채우기",
    desc: "표정 인식",
    reward: "매력 +8, 골드 +20",
    bgColor: 0x003455,
    borderColor: 0x48d4ff,
    glowColor: 0x0d5c84
  },
  {
    key: "DontSmileScene",
    title: "웃음 참기",
    sub: "표정 제어 챌린지",
    desc: "끝까지 버티기",
    reward: "멘탈 +8, 골드 +20",
    bgColor: 0x4d1020,
    borderColor: 0xff6a88,
    glowColor: 0x6d1830
  },
  {
    key: "GymScene",
    title: "헬스장",
    sub: "스페이스 연타",
    desc: "15렙 / 30초",
    reward: "체력 +10, 골드 +20",
    bgColor: 0x1a0800,
    borderColor: 0xff8800,
    glowColor: 0x332200
  },
  {
    key: "CookingScene",
    title: "라면 장인",
    sub: "재료 받기",
    desc: "30초 / 캐치",
    reward: "체력 +15, 골드 +20",
    bgColor: 0x442211,
    borderColor: 0xff8822,
    glowColor: 0x663311
  },
  {
    key: "LottoScene",
    title: "SSAFY 로또",
    sub: "일확천금 가챠",
    desc: "운빨 테스트",
    reward: "1등: 10,000 GP",
    bgColor: 0x001133,
    borderColor: 0xffff00,
    glowColor: 0x002244
  },
  {
    key: 'InterviewScene',
    title: 'TECH INTERVIEW',
    sub: '기술 면접 대비',
    desc: '15SEC / 5 QUESTIONS',
    reward: 'INT +10    GP +30',
    bgColor: 0x1a0033,
    borderColor: 0xFFD700,
    glowColor: 0x330066,
  },
  {
    key: 'DrinkingScene',
    title: '할맥 부어라 마시기',
    sub: '거품 조절 챌린지',
    desc: '5 ROUNDS / BEER',
    reward: 'STRESS -20    GP +10',
    bgColor: 0x221100,
    borderColor: 0xffaa00,
    glowColor: 0x442200,
  },
  {
    key: "MiniGameReflexScene",
    title: "순발력 훈련",
    sub: "실험형 클릭 반응",
    desc: "25초 / 10타겟",
    reward: "실험용",
    bgColor: 0x1d2d20,
    borderColor: 0xa6f07d,
    glowColor: 0x314c35
  }
];
