const fs = require('fs');

const week5 = JSON.parse(fs.readFileSync('c:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week5.json', 'utf8'));

const newFormat = {
  dialogues: []
};

week5.forEach((event, eIdx) => {
  const dialogueId = event.eventId;
  const newDialogue = {
    id: dialogueId,
    label: event.eventName,
    startNodeId: `n1`,
    nodes: {},
    triggerTiming: event.triggerTiming,
    location: event.location,
    eventType: event.eventType
  };

  // Convert initial dialogues to sequence of nodes
  let lastNodeId = '';
  event.dialogues.forEach((dlg, dIdx) => {
    const nodeId = `n${dIdx + 1}`;
    newDialogue.nodes[nodeId] = {
      id: nodeId,
      speaker: dlg.speakerName || (dlg.speakerId === 'SYSTEM' ? 'SYSTEM' : 'NPC'),
      speakerId: dlg.speakerId,
      emotion: dlg.emotion || "NORMAL",
      text: dlg.text
    };
    if (dIdx > 0) {
      newDialogue.nodes[`n${dIdx}`].nextNodeId = nodeId;
    }
    lastNodeId = nodeId;
  });

  // Now, attach choices to the last initial node
  const choiceList = [];
  event.choices.forEach((c, cIdx) => {
    const choiceId = `c${cIdx + 1}`;
    const nextNodeId = `c${cIdx + 1}_res1`;
    
    // Fix requirements format
    let requirements = [];
    if (c.condition) {
       Object.keys(c.condition).forEach(k => {
           requirements.push({ stat: k, min: c.condition[k], label: `${k} ${c.condition[k]} 이상` });
       });
    }

    // Fix statChanges map
    let statChanges = { ...c.result.statChanges };
    delete statChanges.madness;
    delete statChanges.favor_pro;
    // (If removing favor_pro drops all stats, that's fine)

    choiceList.push({
      id: choiceId,
      text: c.text,
      actionType: c.actionType,
      requirements: requirements.length > 0 ? requirements : undefined,
      lockedReason: c.actionType === 'LOCKED' ? "구현 지식이나 스탯이 부족합니다." : undefined,
      statChanges: statChanges,
      nextNodeId: nextNodeId
    });

    // Create result dialogues
    c.result.feedbackDialogues.forEach((fd, fIdx) => {
      const resNodeId = `c${cIdx + 1}_res${fIdx + 1}`;
      newDialogue.nodes[resNodeId] = {
        id: resNodeId,
        speaker: fd.speakerName || (fd.speakerId === 'SYSTEM' ? 'SYSTEM' : fd.speakerId === 'PLAYER' ? 'PLAYER' : 'NPC'),
        speakerId: fd.speakerId,
        emotion: fd.emotion || "NORMAL",
        text: fd.text
      };
      if (fIdx > 0) {
        newDialogue.nodes[`c${cIdx + 1}_res${fIdx}`].nextNodeId = resNodeId;
      }
    });
  });

  if (choiceList.length > 0) {
    newDialogue.nodes[lastNodeId].choices = choiceList;
    // Clean up undefined fields
    newDialogue.nodes[lastNodeId].choices.forEach(ch => {
       if (!ch.requirements) delete ch.requirements;
       if (!ch.lockedReason) delete ch.lockedReason;
    });
  }

  // Cleanup top-level speaker names
  Object.values(newDialogue.nodes).forEach(n => {
    if (n.speaker === 'NPC') {
      if (n.speakerId === 'NPC_PRO_DOYEON') n.speaker = '김도연 프로';
      else n.speaker = '???';
    }
  });

  newFormat.dialogues.push(newDialogue);
});

fs.writeFileSync('c:/Users/SSAFY/Desktop/S14P21E206/temp_week5.json', JSON.stringify(newFormat, null, 2));
