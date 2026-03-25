const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('public/assets/game/data/story/fixedevent/fixed_week5.json', 'utf8'));

const event = rawData[0]; // just get the first one

// mock option
const options = { playerName: "플레이어", fallbackNpcLabel: "NPC" };
const dialogues = event.dialogues || [];
const choices = event.choices || [];
const nodes = {};
const npcLabel = "NPC";

dialogues.forEach((entry, index) => {
  const id = `json_dialogue_${index + 1}`;
  const nextNodeId = index < dialogues.length - 1 ? `json_dialogue_${index + 2}` : undefined;
  nodes[id] = { id, text: entry.text, nextNodeId };
});

if (choices.length > 0) {
  const finalDialogueNode = nodes[`json_dialogue_${dialogues.length}`];
  finalDialogueNode.nextNodeId = undefined;
  finalDialogueNode.choices = choices.map((choice, index) => {
    const choiceId = choice.choiceId ?? index + 1;
    const feedbackDialogues = Array.isArray(choice.result?.feedbackDialogues) ? choice.result.feedbackDialogues : [];
    const feedbackStartNodeId = feedbackDialogues.length > 0 ? `json_choice_feedback_${choiceId}_1` : undefined;

    return { id: `json_choice_${choiceId}`, nextNodeId: feedbackStartNodeId, text: choice.text };
  });

  choices.forEach((choice, index) => {
    const choiceId = choice.choiceId ?? index + 1;
    const feedbackDialogues = Array.isArray(choice.result?.feedbackDialogues) ? choice.result.feedbackDialogues : [];
    if (feedbackDialogues.length === 0) return;

    feedbackDialogues.forEach((entry, feedbackIndex) => {
      const id = `json_choice_feedback_${choiceId}_${feedbackIndex + 1}`;      
      const nextNodeId = feedbackIndex < feedbackDialogues.length - 1 ? `json_choice_feedback_${choiceId}_${feedbackIndex + 2}` : undefined;
      nodes[id] = { id, text: entry.text, nextNodeId };
    });
  });
}

console.log(JSON.stringify(nodes, null, 2));
