export type StoryChoice = {
  id: string;
  text: string;
  nextNodeId: string;
};

export type StoryNode = {
  id: string;
  speaker: string;
  text: string;
  choices: StoryChoice[];
};

