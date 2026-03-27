import fs from "fs";

function testIt() {
  const json = JSON.parse(fs.readFileSync("src/features/story/jsonDialogueAdapter.ts", "utf-8").toString());
}
console.log("Just checking if the user wants an engine change or a data change.")
