const fs = require('fs');

const week5Path = 'c:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week5.json';
const week5 = JSON.parse(fs.readFileSync(week5Path, 'utf8'));

week5.dialogues.forEach(dlg => {
  Object.values(dlg.nodes).forEach(n => {
    if (n.choices) {
      n.choices.forEach(c => {
        if (c.requirements) {
          c.requirements.forEach(r => {
            if (r.stat === 'social') {
              r.stat = 'teamwork';
              r.label = r.label.replace('social', '사교(팀워크)');
            }
            if (r.stat === 'code') {
              // Convert code to fe/be requirement
              r.stat = 'fe';
              r.label = r.label.replace('code', 'FE');
              // push 'be' requirement too
              c.requirements.push({
                stat: 'be',
                min: r.min,
                label: `BE ${r.min} 이상`
              });
            }
          });
        }
        
        if (c.statChanges) {
          if (c.statChanges.social !== undefined) {
             c.statChanges.teamwork = c.statChanges.social;
             delete c.statChanges.social;
          }
          if (c.statChanges.code !== undefined) {
             const codeVal = c.statChanges.code;
             c.statChanges.fe = Math.floor(codeVal / 2);
             c.statChanges.be = Math.ceil(codeVal / 2);
             delete c.statChanges.code;
          }
        }
      });
    }
  });
});

fs.writeFileSync(week5Path, JSON.stringify(week5, null, 2));
