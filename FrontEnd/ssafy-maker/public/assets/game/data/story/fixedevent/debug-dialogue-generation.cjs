const fs = require('fs');
// Load fixed_week1.json
const rawData = JSON.parse(fs.readFileSync('C:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week5.json', 'utf8'));

// Only process EVT_MAIN_W5_D1_MORNING as an example
const event = rawData.find(e => e.eventId === 'EVT_MAIN_W5_D1_MORNING');
console.log(event.choices[0].result.feedbackDialogues);
