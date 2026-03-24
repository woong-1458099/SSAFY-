import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const targetDir = 'FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent';

async function migrate() {
  const files = await fs.readdir(targetDir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(targetDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!data.dialogues || !Array.isArray(data.dialogues)) {
      continue;
    }
    
    let modified = false;
    for (const dialogue of data.dialogues) {
      if (dialogue.triggerTiming && dialogue.location) continue; // Already added
      
      const id = dialogue.id;
      // EVT_MAIN_W1_D1_MORNING_INTRO
      // EVT_ROMANCE_HYO_W1_D4_MORNING
      
      const match = id.match(/_W(\d+)_D(\d+)_([A-Z]+)/);
      if (match) {
        const week = parseInt(match[1], 10);
        const day = parseInt(match[2], 10);
        const timeStr = match[3];
        
        let timeOfDay = "오전";
        if (timeStr === "AFTERNOON") timeOfDay = "오후";
        else if (timeStr === "NIGHT") timeOfDay = "저녁";
        
        // Use campus for all main/romance events by default, as that's what legacy fixed_week did.
        const location = "캠퍼스";
        const eventType = id.includes("ROMANCE") ? "ROMANCE" : "FIXED";
        
        dialogue.triggerTiming = {
          week,
          day,
          timeOfDay
        };
        dialogue.location = location;
        dialogue.eventType = eventType;
        
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Migrated ${file}`);
    }
  }
}

migrate().catch(console.error);
