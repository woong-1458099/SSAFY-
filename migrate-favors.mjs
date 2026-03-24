import fs from 'fs/promises';
import path from 'path';

const targetDir = 'FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent';

const favorMap = {
  'favor_minsu': 'minsu',
  'favor_hyo': 'hyoryeon',
  'favor_hyoryeon': 'hyoryeon',
  'favor_sunmi': 'sunmi',
  'favor_pro': 'sunmi'
};

async function migrateFavors() {
  const files = await fs.readdir(targetDir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(targetDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    let modified = false;
    
    if (data.dialogues) {
      for (const dialogue of data.dialogues) {
        if (dialogue.nodes) {
          for (const nodeKey in dialogue.nodes) {
            const node = dialogue.nodes[nodeKey];
            if (node.choices) {
              for (const choice of node.choices) {
                if (choice.statChanges) {
                  let keepStats = {};
                  let affectionChanges = choice.affectionChanges || {};
                  
                  for (const stat in choice.statChanges) {
                    if (favorMap[stat]) {
                      affectionChanges[favorMap[stat]] = (affectionChanges[favorMap[stat]] || 0) + choice.statChanges[stat];
                      modified = true;
                    } else {
                      keepStats[stat] = choice.statChanges[stat];
                    }
                  }
                  
                  if (Object.keys(keepStats).length > 0) {
                      choice.statChanges = keepStats;
                  } else {
                      delete choice.statChanges;
                  }
                  
                  if (Object.keys(affectionChanges).length > 0) {
                      choice.affectionChanges = affectionChanges;
                  }
                }
              }
            }
          }
        }
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Migrated favors in ${file}`);
    }
  }
}

migrateFavors().catch(console.error);
