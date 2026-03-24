import { readFileSync } from 'fs';

const locationAliases = {                                                                       
  campus: ["캠퍼스", "캠퍼스 내부", "캠퍼스내부", "강의동", "강의실", "실습장", "휴게실", "inssafy"],                                         
  downtown: ["번화가", "시내", "city"],
  world: ["전체지도", "전체 지도", "월드", "맵", "map"],
  home: ["집", "자취방", "기숙사", "home"],
  cafe: ["카페", "cafe"],
  store: ["편의점", "store"]
};

function normalizeFixedEventLocationToken(value) {                                                                    
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/[()[\]{}]/g, "");
}

function matchesFixedEventLocation(rawLocation, currentLocation) {                                           
  const location = normalizeFixedEventLocationToken(rawLocation);     
  const current = normalizeFixedEventLocationToken(currentLocation);  

  if (!location) return true;
  if (!current) return false;
  if (location === current) return true;

  return Object.entries(locationAliases).some(([canonical, aliases]) => {                                                          
    const normalizedValues = [canonical, ...aliases].map(normalizeFixedEventLocationToken);                                                     
    return normalizedValues.includes(location) && normalizedValues.includes(current);                                                         
  });
}

function normalizeToken(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

const rawData = JSON.parse(readFileSync('c:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week4.json', 'utf8'));

const context = {
  week: 4,
  day: 1, // 월요일(0) + 1 = 1
  timeOfDay: "오후",
  location: "캠퍼스"
};
const completedSet = new Set([]);
const targetTime = normalizeToken(context.timeOfDay);

const event = rawData.dialogues.find(event => {
      const timing = event.triggerTiming;
      if (!timing || event.eventType !== "FIXED") return false;       

      const rawEventId = event.id ?? event.eventId;
      const eventId = typeof rawEventId === "string" ? rawEventId : "";                                                                           
      if (event.isRepeatable !== true && eventId && completedSet.has(eventId)) {                                                                    
        return false;
      }

      const sameWeek = Math.round(timing.week ?? -1) === context.week;
      const sameDay = Math.round(timing.day ?? -1) === context.day;   
      const sameTime = normalizeToken(timing.timeOfDay) === targetTime;                                                                           
      const sameLocation = matchesFixedEventLocation(event.location, context.location);
      console.log(`Checking ${event.id}: week(${timing.week}==${context.week}:${sameWeek}), day(${timing.day}==${context.day}:${sameDay}), time(${timing.timeOfDay}==${targetTime}:${sameTime}), loc(${event.location}==${context.location}:${sameLocation})`);
      return sameWeek && sameDay && sameTime && sameLocation;
});

console.log("Matched Event:", event ? event.id : "None");

function createRuntimeDialogueId(id) {
  return "Runtime_" + id;
}

function normalizeChoiceText(text) { return text; }
function normalizeTextWithPlayerName(text) { return text; }

function isRuntimeDialogueId(id) { return true; }

function validateDialogueScript(script) {                                                               
  if (!isRuntimeDialogueId(script.id)) {
    throw new Error(`Runtime dialogue id is invalid: ${script.id}`);                                                                    
  }

  if (!script.startNodeId || !script.nodes[script.startNodeId]) { 
    throw new Error(`Dialogue start node is missing: ${script.id}`);                                                                    
  }

  const nodeEntries = Object.entries(script.nodes);
  if (nodeEntries.length === 0) {
     throw new Error(`No nodes found`);
  }
  return script;
}

function buildDialogueScriptFromFixedEventEntry(dialogueId, event, options) {
  const runtimeDialogueId = createRuntimeDialogueId(dialogueId);      
  const fallbackNpcLabel = options.fallbackNpcLabel;
  const playerName = options.playerName ?? "플레이어";

  // Authored Dialogue (New Format) Handle
  if (event.startNodeId && event.nodes && typeof event.nodes === "object") {                                                                    
    const parsedNodes = {};

    Object.entries(event.nodes).forEach(([nodeId, node]) => {
      parsedNodes[nodeId] = {
        ...node,
        text: normalizeTextWithPlayerName(node.text, "...", playerName)                                                                           
      };

      if (parsedNodes[nodeId].choices) {
        parsedNodes[nodeId].choices = parsedNodes[nodeId].choices?.map((choice) => ({                                                                 
          ...choice,
          text: normalizeChoiceText(choice.text, "선택지", playerName, choice.actionType || "NORMAL"),                                                
          feedbackText: choice.feedbackText ? normalizeTextWithPlayerName(choice.feedbackText, "", playerName) : undefined                          
        }));
      }
    });

    return validateDialogueScript({
      id: runtimeDialogueId,
      label: event.label ?? (event.label ?? event.eventName) ?? fallbackNpcLabel,                                                                 
      startNodeId: event.startNodeId,
      nodes: parsedNodes
    });
  }

  console.log("NOT USING NEW FORMAT BRANCH!");
  return null;
}

try {
  const script = buildDialogueScriptFromFixedEventEntry("TEST_ID", event, { fallbackNpcLabel: "Test", playerName: "TestPlayer" });
  console.log("Build Script Success:", script.id, "Nodes:", Object.keys(script.nodes).length);
} catch (e) {
  console.error("Build Script Error:", e);
}
