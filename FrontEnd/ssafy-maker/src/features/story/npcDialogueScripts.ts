export type StoryStatKey = "fe" | "be" | "teamwork" | "luck" | "stress";
export type DialogueStatKey = StoryStatKey | "hp" | "gold";
export type DialogueChoiceActionType = "NORMAL" | "LOCKED" | "MADNESS";

export type DialogueAction = "openShop" | "openMiniGame" | "playDrinking" | "playInterview" | "playGym" | "playRhythm" | "playCooking";

export type DialogueRequirement = {
  stat: DialogueStatKey;
  min?: number;
  max?: number;
  label?: string;
};

export type DialogueChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
  actionType?: DialogueChoiceActionType;
  statChanges?: Partial<Record<DialogueStatKey, number>>;
  requirements?: DialogueRequirement[];
  lockedReason?: string;
  feedbackText?: string;
  action?: DialogueAction;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  speakerId?: string;
  emotion?: string;
  text: string;
  nextNodeId?: string;
  choices?: DialogueChoice[];
  action?: DialogueAction;
};

export type NpcDialogueId =
  | "campus_script_npc"
  | "npc_myungjin"
  | "npc_yeonwoong"
  | "npc_hyoryeon"
  | "npc_jiwoo"
  | "npc_jongmin"
  | "npc_minsu"
  | "campus_sunmi"
  | "campus_doyeon"
  | "campus_hyunseok"
  | "fixed_event_runtime";

export type NpcDialogueScript = {
  npcId: NpcDialogueId;
  npcLabel: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
};

export const NPC_DIALOGUE_SCRIPTS: Record<NpcDialogueId, NpcDialogueScript> = {
  campus_script_npc: {
    npcId: "campus_script_npc",
    npcLabel: "\uC2A4\uD06C\uB9BD\uD2B8 NPC",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uC2A4\uD06C\uB9BD\uD2B8 NPC",
        text: "\uC9C0\uAE08\uC740 \uACE0\uC815 \uC774\uBCA4\uD2B8 JSON \uC5F0\uB3D9 \uD14C\uC2A4\uD2B8\uC6A9 NPC\uC608\uC694.",
        choices: [
          {
            id: "role",
            text: "\uC9C0\uAE08\uC740 \uBB34\uC2A8 \uC5ED\uD560\uC774\uC57C?",
            nextNodeId: "role_result"
          },
          {
            id: "bye",
            text: "\uB2E4\uC74C\uC5D0 \uB2E4\uC2DC \uBCFC\uAC8C.",
            nextNodeId: "bye_result"
          }
        ]
      },
      role_result: {
        id: "role_result",
        speaker: "\uC2A4\uD06C\uB9BD\uD2B8 NPC",
        text: "\uC2A4\uD1A0\uB9AC \uD30C\uC774\uD504\uB77C\uC778\uC774 \uC815\uC0C1\uC801\uC73C\uB85C \uB3CC\uC544\uAC00\uB294\uC9C0 \uD655\uC778\uD558\uB294 \uC911\uC774\uC57C."
      },
      bye_result: {
        id: "bye_result",
        speaker: "\uC2A4\uD06C\uB9BD\uD2B8 NPC",
        text: "\uD544\uC694\uD558\uBA74 \uC5B8\uC81C\uB4E0 \uB2E4\uC2DC \uBD88\uB7EC."
      }
    }
  },
  npc_myungjin: {
    npcId: "npc_myungjin",
    npcLabel: "\uBA85\uC9C4",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uBA85\uC9C4",
        text: "\uC624\uB298\uB3C4 \uD300 \uC77C\uC740 \uCC28\uBD84\uD558\uAC8C \uC815\uB9AC\uD558\uBA74 \uB3FC.",
        choices: [{ id: "bye", text: "\uC54C\uACA0\uC5B4, \uACE0\uB9C8\uC6CC." }]
      }
    }
  },
  npc_yeonwoong: {
    npcId: "npc_yeonwoong",
    npcLabel: "\uC5F0\uC6C5",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uC5F0\uC6C5",
        text: "\uBB38\uC81C \uD558\uB098\uC529 \uB05D\uAE4C\uC9C0 \uBC00\uC5B4\uBD99\uC774\uBA74 \uB290\uC2E4\uB825\uC774 \uC798 \uC62C\uB77C\uC694.",
        choices: [{ id: "bye", text: "\uC870\uC5B8 \uACE0\uB9C8\uC6CC!" }]
      }
    }
  },
  npc_hyoryeon: {
    npcId: "npc_hyoryeon",
    npcLabel: "\uD6A8\uB828",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uD6A8\uB828",
        text: "\uB204\uC801\uB418\uBA74 \uC9C0\uCE58\uB2C8\uAE4C \uD14C\uD0C0\uC784\uC774\uB77C\uB3C4 \uC544\uAF34\uC9C0 \uB9C8.",
        choices: [{ id: "bye", text: "\uC5B4, \uC7A0\uAE50 \uC26C\uC5B4\uAC08\uAC8C." }]
      }
    }
  },
  npc_jiwoo: {
    npcId: "npc_jiwoo",
    npcLabel: "\uC9C0\uC6B0",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uC9C0\uC6B0",
        text: "\uD300 \uD504\uB85C\uC81D\uD2B8\uB294 \uACB0\uAD6D \uC18C\uD1B5\uC774 \uC808\uBC18\uC774\uC57C. \uB9D0\uC744 \uB9CE\uC774 \uB9DE\uCDB0\uBCF4\uC790.",
        choices: [{ id: "bye", text: "\uC751, \uAC19\uC774 \uB9DE\uCDB0\uBCF4\uC790." }]
      }
    }
  },
  npc_jongmin: {
    npcId: "npc_jongmin",
    npcLabel: "\uC885\uBBFC",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uC885\uBBFC",
        text: "\uCCB4\uB825\uB3C4 \uC2E4\uB825\uC774\uC57C. \uC624\uB798 \uBC84\uD2F0\uB824\uBA74 \uD398\uC774\uC2A4 \uC870\uC808\uC774 \uC911\uC694\uD574.",
        choices: [{ id: "bye", text: "\uC624\uB298\uC740 \uBB34\uB9AC\uD558\uC9C0 \uC54A\uC744\uAC8C." }]
      }
    }
  },
  npc_minsu: {
    npcId: "npc_minsu",
    npcLabel: "\uBBFC\uC218",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uBBFC\uC218",
        text: "\uBAA8\uB974\uB294 \uAC74 \uBC14\uB85C \uBB3B\uB294 \uAC8C \uBE60\uB974\uB2E4. \uD63C\uC790 \uB04C\uC5B4\uC548\uC9C0 \uB9D0\uACE0.",
        choices: [{ id: "bye", text: "\uADF8\uB7F4\uAC8C, \uACE0\uB9C8\uC6CC." }]
      }
    }
  },
  campus_sunmi: {
    npcId: "campus_sunmi",
    npcLabel: "\uC870\uC120\uBBF8 \uD504\uB85C",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uC870\uC120\uBBF8 \uD504\uB85C",
        text: "\uAE30\uBCF8\uAE30\uB97C \uCC28\uADFC\uCC28\uADFC \uC313\uC73C\uBA74 \uB418\uB2C8 \uB108\uBB34 \uC870\uAE09\uD574\uD558\uC9C0 \uB9C8\uC138\uC694.",
        choices: [{ id: "bye", text: "\uB124, \uBA85\uC2EC\uD560\uAC8C\uC694." }]
      }
    }
  },
  campus_doyeon: {
    npcId: "campus_doyeon",
    npcLabel: "\uAE40\uB3C4\uC5F0 \uD504\uB85C",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uAE40\uB3C4\uC5F0 \uD504\uB85C",
        text: "\uD750\uB984\uC744 \uC774\uD574\uD558\uBA74 \uC138\uBD80 \uBB38\uBC95\uC740 \uB530\uB77C\uC635\uB2C8\uB2E4. \uAC80\uC0C9\uD558\uB294 \uC2B5\uAD00\uB3C4 \uC2E4\uB825\uC774\uC5D0\uC694.",
        choices: [{ id: "bye", text: "\uC54C\uACA0\uC2B5\uB2C8\uB2E4!" }]
      }
    }
  },
  campus_hyunseok: {
    npcId: "campus_hyunseok",
    npcLabel: "\uC774\uD604\uC11D \uCEE8\uC124\uD134\uD2B8",
    startNodeId: "intro",
    nodes: {
      intro: {
        id: "intro",
        speaker: "\uC774\uD604\uC11D \uCEE8\uC124\uD134\uD2B8",
        text: "\uC694\uC998 \uD504\uB85C\uC81D\uD2B8 \uC9C4\uD589\uC740 \uC5B4\uB5A4\uAC00\uC694? \uBB38\uC81C\uAC00 \uC788\uC73C\uBA74 \uBE68\uB9AC \uACF5\uC720\uD558\uC138\uC694.",
        choices: [{ id: "bye", text: "\uB124, \uD655\uC778\uD574\uBCFC\uAC8C\uC694." }]
      }
    }
  },
  fixed_event_runtime: {
    npcId: "fixed_event_runtime",
    npcLabel: "\uC774\uBCA4\uD2B8",
    startNodeId: "placeholder",
    nodes: {
      placeholder: {
        id: "placeholder",
        speaker: "\uC774\uBCA4\uD2B8",
        text: "\uC774\uBCA4\uD2B8 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4."
      }
    }
  }
};
