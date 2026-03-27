const fs = require('fs');
const Ajv = require('ajv/dist/2020');
const ajv = new Ajv({allErrors: true});
const schema = JSON.parse(fs.readFileSync('scripts/schemas/authored-dialogues.schema.json'));
const validate = ajv.compile(schema);
const data = JSON.parse(fs.readFileSync('public/assets/game/data/story/fixedevent/fixed_week5.json'));
const valid = validate(data);
if (!valid) console.log(validate.errors);
