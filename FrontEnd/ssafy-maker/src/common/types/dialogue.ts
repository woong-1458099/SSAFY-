// 대화 스크립트와 대화 매니저가 함께 사용하는 공통 대화 타입 정의
import type { DialogueId } from "../enums/dialogue";

export type DialogueChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
};

export type DialogueNode = {
  id: string;
  speaker: string;
  text: string;
  nextNodeId?: string;
  choices?: DialogueChoice[];
};

export type DialogueScript = {
  id: DialogueId;
  label: string;
  startNodeId: string;
  nodes: Record<string, DialogueNode>;
};
