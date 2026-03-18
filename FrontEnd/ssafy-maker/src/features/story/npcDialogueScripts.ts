export type StoryStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";

export type DialogueAction = "openShop" | "openMiniGame" | "playDrinking" | "playInterview" | "playGym" | "playRhythm" | "playConflict" | "playCooking";

export type DialogueRequirement = {
  stat: StoryStatKey;
  min?: number;
  max?: number;
  label?: string;
};

export type DialogueChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
  statChanges?: Partial<Record<StoryStatKey, number>>;
  requirements?: DialogueRequirement[];
  lockedReason?: string;
  action?: DialogueAction;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  text: string;
  nextNodeId?: string;
  choices?: DialogueChoice[];
  action?: DialogueAction;
};

export type NpcDialogueId =
  | "downtown_shopkeeper"
  | "campus_senior"
  | "campus_script_npc"
  | "npc_myungjin"
  | "npc_yeonwoong"
  | "npc_hyoryeon"
  | "npc_jiwoo"
  | "npc_jongmin"
  | "npc_minsu";

export type NpcDialogueScript = {
  npcId: NpcDialogueId;
  npcLabel: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
};

// Sample scripts for two NPCs.
// Replace or expand these nodes when real narrative scripts are ready.
export const NPC_DIALOGUE_SCRIPTS: Record<NpcDialogueId, NpcDialogueScript> = {
  downtown_shopkeeper: {
    npcId: "downtown_shopkeeper",
    npcLabel: "상점 주인",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "상점 주인",
        text: "어서 와. 오늘은 뭘 도와줄까?",
        choices: [
          {
            id: "open_shop",
            text: "물건을 보고 싶어요.",
            nextNodeId: "shop_open"
          },
          {
            id: "coding_tip",
            text: "FE 장비 추천해 주세요.",
            nextNodeId: "coding_tip_result",
            requirements: [{ stat: "fe", min: 25, label: "FE 25 이상" }],
            lockedReason: "FE가 조금 더 필요해.",
            statChanges: { fe: 2, be: 1, stress: 1 }
          },
          {
            id: "discount",
            text: "할인 받을 수 있을까요?",
            nextNodeId: "discount_result",
            requirements: [{ stat: "luck", min: 15, label: "운 15 이상" }],
            lockedReason: "운이 좋아야 흥정이 통하지.",
            statChanges: { luck: 1 }
          },
          {
            id: "bye",
            text: "다음에 올게요.",
            nextNodeId: "bye_result"
          }
        ]
      },
      shop_open: {
        id: "shop_open",
        speaker: "상점 주인",
        text: "좋아, 진열장을 열어둘게.",
        action: "openShop"
      },
      coding_tip_result: {
        id: "coding_tip_result",
        speaker: "상점 주인",
        text: "타건감 좋은 키보드를 먼저 써봐. 손이 금방 익을 거야."
      },
      discount_result: {
        id: "discount_result",
        speaker: "상점 주인",
        text: "오늘은 기분이 좋네. 다음 방문 때 작은 서비스 줄게."
      },
      bye_result: {
        id: "bye_result",
        speaker: "상점 주인",
        text: "필요할 때 다시 와."
      }
    }
  },
  campus_senior: {
    npcId: "campus_senior",
    npcLabel: "캠퍼스 선배",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "캠퍼스 선배",
        text: "모의 면접할래? 선택에 따라 성장 방향이 달라져.",
        choices: [
          {
            id: "basic_training",
            text: "기본 협업 트레이닝 부탁해요.",
            nextNodeId: "basic_training_result",
            requirements: [{ stat: "teamwork", min: 20, label: "협업 20 이상" }],
            lockedReason: "기본 협업부터 더 끌어올리자.",
            statChanges: { teamwork: 3, luck: 1 }
          },
          {
            id: "advanced_training",
            text: "고급 협업 시뮬레이션 도전할게요.",
            nextNodeId: "advanced_training_result",
            requirements: [{ stat: "teamwork", min: 45, label: "협업 45 이상" }],
            lockedReason: "협업 45 이상부터 가능해.",
            statChanges: { teamwork: 4, fe: 1, be: 1, stress: 3 }
          },
          {
            id: "open_minigame",
            text: "미니게임 센터로 들어갈게요.",
            nextNodeId: "open_minigame_result",
            requirements: [
              { stat: "fe", min: 20, label: "FE 20 이상" },
              { stat: "be", min: 20, label: "BE 20 이상" }
            ],
            lockedReason: "FE 20 / BE 20 이상이어야 입장 가능해.",
            statChanges: { luck: 1 }
          },
          {
            id: "rest",
            text: "오늘은 가볍게 조언만 들을게요.",
            nextNodeId: "rest_result",
            statChanges: { stress: -2 }
          },
          {
            id: "play_drinking_test",
            text: "[테스트] 같이 맥주 한잔해요!",
            action: "playDrinking"
          }
        ]
      },
      basic_training_result: {
        id: "basic_training_result",
        speaker: "캠퍼스 선배",
        text: "좋아. 질문의 핵심부터 말하는 습관을 유지해."
      },
      advanced_training_result: {
        id: "advanced_training_result",
        speaker: "캠퍼스 선배",
        text: "난이도 높은 상황에서도 팀과 리듬을 맞추는 게 포인트야."
      },
      open_minigame_result: {
        id: "open_minigame_result",
        speaker: "캠퍼스 선배",
        text: "좋아, 센터 문을 열어둘게.",
        action: "openMiniGame"
      },
      rest_result: {
        id: "rest_result",
        speaker: "캠퍼스 선배",
        text: "휴식도 전략이야. 다음엔 실전으로 가보자."
      }
    }
  },
  campus_script_npc: {
    npcId: "campus_script_npc",
    npcLabel: "스크립트 NPC",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "스크립트 NPC",
        text: "나중에 JSON 스크립트를 연결할 테스트용 NPC야. 지금은 임시 대사만 보여주고 있어.",
        choices: [
          {
            id: "placeholder_info",
            text: "지금은 어떤 역할이야?",
            nextNodeId: "placeholder_info_result"
          },
          {
            id: "bye",
            text: "나중에 다시 올게.",
            nextNodeId: "bye_result"
          }
        ]
      },
      placeholder_info_result: {
        id: "placeholder_info_result",
        speaker: "스크립트 NPC",
        text: "새 JSON 대사 파일을 붙이기 전까지 이 자리를 맡고 있을게."
      },
      bye_result: {
        id: "bye_result",
        speaker: "스크립트 NPC",
        text: "준비되면 새 대사로 바꿔줘."
      }
    }
  },
  npc_myungjin: {
    npcId: "npc_myungjin",
    npcLabel: "명진",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "명진",
        text: "안녕! 면접 준비는 잘 돼가? 실제처럼 연습 한번 해볼래?",
        choices: [
          { id: "play", text: "면접 연습 시작하기", action: "playInterview" },
          { id: "bye", text: "나중에 올게." }
        ]
      }
    }
  },
  npc_yeonwoong: {
    npcId: "npc_yeonwoong",
    npcLabel: "연웅",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "연웅",
        text: "배고프지 않아? 내가 기가 막힌 라면 레시피를 알고 있는데...",
        choices: [
          { id: "play", text: "라면 끓이기 도전", action: "playCooking" },
          { id: "bye", text: "다음에 먹을게." }
        ]
      }
    }
  },
  npc_hyoryeon: {
    npcId: "npc_hyoryeon",
    npcLabel: "효련",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "효련",
        text: "공부만 하면 머리 아프잖아. 노래 한 곡 하면서 스트레스 풀래?",
        choices: [
          { id: "play", text: "리듬 게임 시작", action: "playRhythm" },
          { id: "bye", text: "지금은 바빠." }
        ]
      }
    }
  },
  npc_jiwoo: {
    npcId: "npc_jiwoo",
    npcLabel: "지우",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "지우",
        text: "팀 프로젝트하다 보면 갈등이 생기기 마련이지. 같이 해결책을 찾아볼까?",
        choices: [
          { id: "play", text: "갈등 해결 시뮬레이션", action: "playConflict" },
          { id: "bye", text: "혼자 생각해볼게." }
        ]
      }
    }
  },
  npc_jongmin: {
    npcId: "npc_jongmin",
    npcLabel: "종민",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "종민",
        text: "개발자는 체력이 국력이야! 같이 운동해서 기초 체력 좀 길러둘까?",
        choices: [
          { id: "play", text: "기초 체력 단련", action: "playGym" },
          { id: "bye", text: "오늘 좀 피곤하네." }
        ]
      }
    }
  },
  npc_minsu: {
    npcId: "npc_minsu",
    npcLabel: "민수",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "민수",
        text: "오늘 정말 고생 많았어! 팀원들이랑 가볍게 맥주 한잔하면서 회포 풀까?",
        choices: [
          { id: "play", text: "맥주 파티 시작", action: "playDrinking" },
          { id: "bye", text: "술은 다음에!" }
        ]
      }
    }
  }
};
