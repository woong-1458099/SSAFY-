export const INTRO_OPENING_STORY_TEXT = "202X년 6월,\nSSAFY 14기 면접을 앞둔 당신은\n역삼역에 도착했다.";

export const INTRO_SCRIPT_TEXT = {
  passReveal: "헉!!",
  victoryPrimary: "됐다!!! 만세!!!",
  victorySecondary: "나도 이제 싸피생이야!!!",
  guideToStart: "- 클릭하여 시작 -",
  easterEggWarning: "안돼!!!",
  exitCrowd: "잠시만요! 내릴게요!!",
  panicMumble: "그... 그게...",
  panicAftershock: "어떡하지...? 망쳤나?",
  daysLater: "며칠 후...",
  subwayNarration: "겨우 역삼역에 내렸다.\n 사람 사이에 끼여 죽는 줄 알았네. \n 서울은 정말 무서운 곳이구나.",
  waitNarration: "다행히 면접시간까지는 꽤 시간이 남았으니... \n 잠시 앉아서 서류도 확인하고, 예상 질문도 다시 읽어보고...",
  cutNarration: "...그렇게 하려고 했는데...",
  confusedNarration: "어... 왜 내가 벌써 면접장 안이지...?"
} as const;

export const INTRO_INTERVIEW_QUESTIONS = [
  "지원자분은 왜 SSAFY에 지원하셨죠?",
  "자신의 가장 큰 단점이 뭐라고 생각하세요?",
  "백준 레벨이 어떻게 되시나요?",
  "갈등 상황 해결 방법은?",
  "팀 프로젝트 경험은?",
  "본인의 기술적 강점은?",
  "협업 시 중요한 점은?",
  "본인이 생각하는 10년 후 모습은?"
] as const;

export function getIntroInterviewBubblePositions(width: number, height: number): Array<{ x: number; y: number }> {
  return [
    { x: width * 0.25, y: height * 0.2 },
    { x: width * 0.75, y: height * 0.2 },
    { x: width * 0.2, y: height * 0.45 },
    { x: width * 0.8, y: height * 0.45 },
    { x: width * 0.5, y: height * 0.15 },
    { x: width * 0.5, y: height * 0.55 },
    { x: width * 0.15, y: height * 0.7 },
    { x: width * 0.85, y: height * 0.7 }
  ];
}
