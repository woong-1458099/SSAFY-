const fs = require("fs");
const path = require("path");

const defaultDataDir = path.resolve(__dirname, "..", "..", "..", "public", "assets", "game", "data", "story", "fixedevent");
const inputArg = process.argv[2] ?? "fixed_week5.json";
const eventIdArg = process.argv[3];
const inputPath = path.isAbsolute(inputArg)
  ? inputArg
  : path.resolve(defaultDataDir, inputArg);

const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const events = Array.isArray(rawData) ? rawData : rawData.events;

if (!Array.isArray(events)) {
  throw new Error(`Expected an event array in ${inputPath}`);
}

const event = eventIdArg
  ? events.find((entry) => entry?.eventId === eventIdArg)
  : events[0];

if (!event) {
  throw new Error(`Event "${eventIdArg}" not found in ${inputPath}`);
}

console.log(event.choices?.[0]?.result?.feedbackDialogues ?? []);
