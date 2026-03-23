const fs = require('fs');
const path = require('path');

const FIXED_EVENT_DIR = process.cwd(); // Assuming we are in the directory already

function traverse(obj) {
  let changed = false;

  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if (Array.isArray(obj)) {
    for (let item of obj) {
      if (traverse(item)) changed = true;
    }
    return changed;
  }

  // If this is a choice node containing statChanges
  if (obj.statChanges) {
    let newAffection = obj.affectionChanges || {};
    let migratedKeys = [];

    for (const key of Object.keys(obj.statChanges)) {
      if (key.startsWith('favor_')) {
        let val = obj.statChanges[key];
        let npcId = key.replace('favor_', '');
        
        if (npcId === 'hyo') npcId = 'hyoryeon';
        else if (npcId === 'pro') npcId = 'sunmi';

        newAffection[npcId] = val;
        migratedKeys.push(key);
      }
    }

    if (migratedKeys.length > 0) {
      obj.affectionChanges = newAffection;
      for (const key of migratedKeys) {
        delete obj.statChanges[key];
      }
      
      // Remove statChanges if empty
      if (Object.keys(obj.statChanges).length === 0) {
        delete obj.statChanges;
      }
      changed = true;
    }
  }

  // Recurse down
  for (const key of Object.keys(obj)) {
    if (traverse(obj[key])) {
      changed = true;
    }
  }

  return changed;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const fullPath = path.join(dirPath, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let parsed;
      try { parsed = JSON.parse(content); } catch (e) { continue; }
      
      if (traverse(parsed)) {
        console.log(`Updated ${file}`);
        fs.writeFileSync(fullPath, JSON.stringify(parsed, null, 2), 'utf8');
      }
    }
  }
}

processDirectory(FIXED_EVENT_DIR);
// Also go up one level and do romance
const ROMANCE_DIR = path.join(__dirname, '..', 'romance');
if (fs.existsSync(ROMANCE_DIR)) {
    processDirectory(ROMANCE_DIR);
}
