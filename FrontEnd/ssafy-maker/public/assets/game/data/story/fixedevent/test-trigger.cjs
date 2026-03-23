const { readFileSync } = require('fs');
const content = readFileSync('C:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week1.json', 'utf8');
const data = JSON.parse(content);
const timing = data[0].triggerTiming;
console.log(timing);
console.log(data[0].eventId);
