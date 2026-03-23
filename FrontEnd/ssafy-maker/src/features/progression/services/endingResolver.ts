import type { EndingComicPanel, EndingFlowPayload, EndingId, EndingResult, EndingSummaryStat } from "@features/progression/types/ending";

type EndingProfile = {
  endingId: EndingId;
  title: string;
  shortDescription: string;
  introLines: string[];
  npcLine: string;
  comicPanels: EndingComicPanel[];
  dominantLabels: string[];
};

const COOP_LEADER_THRESHOLD = 75;

const ENDING_PROFILES: Record<EndingId, Omit<EndingProfile, "endingId">> = {
  "frontend-developer": {
    title: "프론트엔드 개발자 엔딩",
    shortDescription: "화면의 감각과 사용자 경험을 끝까지 붙든 결과, UI를 책임지는 신입으로 출발한다.",
    introLines: [
      "일요일 밤, 마지막 화면 전환까지 다듬고 나니 6주가 한 장의 프로토타입처럼 지나가 있었다.",
      "누군가는 기능을 기억하겠지만, 너는 사람들이 처음 마주하는 장면을 설계해냈다.",
      "다음 날 수료식에서는 '사용자에게 가장 먼저 닿는 사람'이라는 말이 유난히 또렷하게 남는다."
    ],
    npcLine: "화면 하나에도 의도가 보이더라. 이제 그 감각을 팀의 첫인상으로 만들어 봐.",
    comicPanels: [
      { id: "panel-1", title: "새벽 다듬기", body: "마지막 버튼 간격을 맞추며 밤을 넘긴다.", accentColor: 0x6ab8ff },
      { id: "panel-2", title: "수료식 박수", body: "프로토타입 시연 직후 발표장이 조용히 고개를 끄덕인다.", accentColor: 0x73d3ff },
      { id: "panel-3", title: "첫 제안", body: "신입 온보딩 자리에서 디자인 시스템 초안 이야기가 나온다.", accentColor: 0x8fe0ff },
      { id: "panel-4", title: "새 출발", body: "모니터 앞에서 첫 화면을 다시 그릴 준비를 한다.", accentColor: 0x9ce7e3 }
    ],
    dominantLabels: ["FE", "표현력", "사용자 경험"]
  },
  "backend-developer": {
    title: "백엔드 개발자 엔딩",
    shortDescription: "보이지 않는 흐름을 끝까지 붙들어, 시스템을 버티게 만드는 사람으로 기억된다.",
    introLines: [
      "주말 내내 API와 데이터 흐름을 다잡느라 화면보다 로그를 더 오래 바라봤다.",
      "겉으로 드러나진 않아도, 팀은 마지막까지 무너지지 않는 구조를 갖게 됐다.",
      "종료식 뒤 면담에서는 '믿고 맡길 수 있는 엔진룸'이라는 말이 남는다."
    ],
    npcLine: "안 보이는 곳을 책임지는 사람은 결국 팀 전체의 속도를 지켜 준다.",
    comicPanels: [
      { id: "panel-1", title: "로그 확인", body: "새벽 로그창에서 마지막 경고를 지운다.", accentColor: 0x6ab8ff },
      { id: "panel-2", title: "안정화", body: "시연 직전에도 서버 상태는 조용히 버텨 준다.", accentColor: 0x73d3ff },
      { id: "panel-3", title: "면담", body: "멘토는 구조를 묻고, 너는 차분히 이유를 설명한다.", accentColor: 0x8fe0ff },
      { id: "panel-4", title: "다음 환경", body: "더 큰 트래픽을 견딜 시스템을 상상한다.", accentColor: 0x9ce7e3 }
    ],
    dominantLabels: ["BE", "구조", "안정성"]
  },
  "team-player": {
    title: "팀 플레이어 엔딩",
    shortDescription: "혼자 빛나기보다 팀을 굴러가게 만든 선택들이 결국 가장 오래 남는다.",
    introLines: [
      "마지막 밤엔 코드보다 사람들의 상태를 먼저 살피게 됐다.",
      "누가 막히는지, 어디서 흐름이 끊기는지 챙긴 덕분에 팀은 끝까지 함께 완주했다.",
      "다음 날 마지막 면담에서는 '같이 일하고 싶은 사람'이라는 평가가 가장 크게 남는다."
    ],
    npcLine: "협업은 스펙이 아니라 습관이야. 너는 이미 그걸 몸으로 보여줬어.",
    comicPanels: [
      { id: "panel-1", title: "마지막 점검", body: "팀원 자리 사이를 오가며 빠진 부분을 메운다.", accentColor: 0x6ab8ff },
      { id: "panel-2", title: "함께 시연", body: "발표는 각자 했지만 결과물은 하나로 이어진다.", accentColor: 0x73d3ff },
      { id: "panel-3", title: "단체 사진", body: "수료식 뒤 웃는 얼굴이 가장 먼저 남는다.", accentColor: 0x8fe0ff },
      { id: "panel-4", title: "새 팀", body: "다음 프로젝트에서도 먼저 손을 내미는 사람이 된다.", accentColor: 0x9ce7e3 }
    ],
    dominantLabels: ["협업", "조율", "완주"]
  },
  "stamina-survivor": {
    title: "체력왕 생존 엔딩",
    shortDescription: "끝까지 흔들리지 않는 페이스로 버텨낸 덕분에, 가장 오래 달릴 수 있는 사람으로 남는다.",
    introLines: [
      "지칠 법한 마지막 밤에도 네 리듬은 크게 무너지지 않았다.",
      "체력이 남아 있다는 건 결국 선택지를 남겨 두는 일이라는 걸 몸으로 배웠다.",
      "종료식이 끝난 뒤에도 너는 아직 한 걸음 더 갈 수 있는 표정이다."
    ],
    npcLine: "버텨내는 힘도 실력이야. 긴 프로젝트일수록 그 차이가 크게 난다.",
    comicPanels: [
      { id: "panel-1", title: "막판 집중", body: "피곤한 팀 사이에서도 리듬을 잃지 않는다.", accentColor: 0x6ab8ff },
      { id: "panel-2", title: "끝까지 참여", body: "정리와 마감까지 자리를 지키며 흐름을 이어 간다.", accentColor: 0x73d3ff },
      { id: "panel-3", title: "수료 후 산책", body: "행사가 끝난 뒤에도 걸음이 가볍다.", accentColor: 0x8fe0ff },
      { id: "panel-4", title: "다음 도전", body: "긴 호흡의 프로젝트도 버틸 자신이 생긴다.", accentColor: 0x9ce7e3 }
    ],
    dominantLabels: ["체력", "지속력", "생존"]
  },
  "lucky-break": {
    title: "인생 역전 엔딩",
    shortDescription: "기묘하게 맞아떨어진 선택과 타이밍이 의외의 기회를 열어 준다.",
    introLines: [
      "이번 주는 이상하게도 작은 선택들이 자꾸 좋은 쪽으로 굴러갔다.",
      "실력 위에 얹힌 운이 마지막 순간의 문을 열어 준 셈이다.",
      "수료식 뒤 예상치 못한 제안 하나가 네 계획을 통째로 바꿔 놓는다."
    ],
    npcLine: "운이 왔을 때 잡는 것도 능력이지. 이번엔 네 차례였어.",
    comicPanels: [
      { id: "panel-1", title: "우연한 기회", body: "마지막 발표 순서가 오히려 집중을 끈다.", accentColor: 0x6ab8ff },
      { id: "panel-2", title: "예상 밖 질문", body: "가볍게 건넨 답변이 강한 인상을 남긴다.", accentColor: 0x73d3ff },
      { id: "panel-3", title: "명함 한 장", body: "행사 뒤 우연히 받은 명함이 손에 남는다.", accentColor: 0x8fe0ff },
      { id: "panel-4", title: "새 길", body: "예상하지 못한 방향으로 커리어가 열리기 시작한다.", accentColor: 0x9ce7e3 }
    ],
    dominantLabels: ["운", "기회", "반전"]
  },
  "frontend-leader": {
    title: "협업형 프론트 리더 엔딩",
    shortDescription: "화면을 설계하는 감각과 팀을 묶는 힘이 동시에 드러나, 다음 프로젝트의 중심 역할로 이어진다.",
    introLines: [
      "마지막 주에는 화면을 다듬는 손과 사람을 묶는 말이 동시에 필요했다.",
      "결과물은 예쁘게 마무리됐고, 팀도 끝까지 흐트러지지 않았다.",
      "다음 날 마지막 자리에서는 '앞단을 이끄는 사람'이라는 기대가 조용히 모인다."
    ],
    npcLine: "완성도와 협업을 같이 잡는 사람은 드물어. 다음엔 네가 앞에서 방향을 잡아 봐.",
    comicPanels: [
      { id: "panel-1", title: "화면 정리", body: "마지막 UI를 다듬는 동시에 팀 진행표를 맞춘다.", accentColor: 0x6ab8ff },
      { id: "panel-2", title: "함께 시연", body: "발표 흐름과 장면 전환이 한 팀처럼 맞물린다.", accentColor: 0x73d3ff },
      { id: "panel-3", title: "마지막 피드백", body: "멘토는 결과보다 리딩 방식을 먼저 칭찬한다.", accentColor: 0x8fe0ff },
      { id: "panel-4", title: "다음 스프린트", body: "새 프로젝트 킥오프에서 자연스럽게 앞줄에 선다.", accentColor: 0x9ce7e3 }
    ],
    dominantLabels: ["FE", "협업", "리더십"]
  }
};

const PRIORITY: Array<EndingSummaryStat["key"]> = ["fe", "be", "teamwork", "hp", "luck"];

export type { EndingId, EndingComicPanel, EndingResult };

export function resolveEnding(input: Pick<EndingFlowPayload, "fe" | "be" | "teamwork" | "luck" | "hp">): EndingResult {
  const summaryStats: EndingSummaryStat[] = [
    { key: "fe", label: "FE", value: Math.round(input.fe) },
    { key: "be", label: "BE", value: Math.round(input.be) },
    { key: "teamwork", label: "협업", value: Math.round(input.teamwork) },
    { key: "hp", label: "체력", value: Math.round(input.hp) },
    { key: "luck", label: "운", value: Math.round(input.luck) }
  ];

  const endingId = resolveEndingId(summaryStats);
  const profile = ENDING_PROFILES[endingId];

  return {
    endingId,
    title: profile.title,
    shortDescription: profile.shortDescription,
    summaryStats,
    introLines: profile.introLines,
    npcLine: profile.npcLine,
    comicPanels: profile.comicPanels,
    dominantLabels: profile.dominantLabels
  };
}

function resolveEndingId(stats: EndingSummaryStat[]): EndingId {
  const fe = stats.find((stat) => stat.key === "fe")?.value ?? 0;
  const teamwork = stats.find((stat) => stat.key === "teamwork")?.value ?? 0;

  if (fe >= COOP_LEADER_THRESHOLD && teamwork >= COOP_LEADER_THRESHOLD) {
    return "frontend-leader";
  }

  let best = stats[0];
  for (const key of PRIORITY) {
    const candidate = stats.find((stat) => stat.key === key);
    if (!candidate) continue;
    if (candidate.value > best.value) {
      best = candidate;
      continue;
    }
    if (candidate.value === best.value && PRIORITY.indexOf(candidate.key) < PRIORITY.indexOf(best.key)) {
      best = candidate;
    }
  }

  switch (best.key) {
    case "fe":
      return "frontend-developer";
    case "be":
      return "backend-developer";
    case "teamwork":
      return "team-player";
    case "hp":
      return "stamina-survivor";
    case "luck":
    default:
      return "lucky-break";
  }
}
