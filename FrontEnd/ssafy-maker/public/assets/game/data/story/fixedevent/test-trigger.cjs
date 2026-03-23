const { readFileSync } = require("fs");
const path = require("path");

const inputArg = process.argv[2] ?? "fixed_week1.json";
const inputPath = path.isAbsolute(inputArg)
  ? inputArg
  : path.resolve(__dirname, inputArg);

const content = readFileSync(inputPath, "utf8");
const data = JSON.parse(content);
const firstEvent = Array.isArray(data) ? data[0] : data.events?.[0];

if (!firstEvent) {
  throw new Error(`No fixed event found in ${inputPath}`);
}

console.log(firstEvent.triggerTiming);
console.log(firstEvent.eventId);
