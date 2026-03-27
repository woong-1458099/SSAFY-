const fs = require('fs');
const d = JSON.parse(fs.readFileSync('c:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week5.json', 'utf8'));
d.dialogues[0].triggerTiming.timeOfDay = "오전"; // W5_D1
d.dialogues[1].triggerTiming.timeOfDay = "오후"; // W5_D4
fs.writeFileSync('c:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week5.json', JSON.stringify(d, null, 2));
