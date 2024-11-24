import * as fs from "fs";
import yargs from "yargs";
import {
  capitalizeString,
  insertStatementBefore,
  insertStatementBeforeInFile,
  processTemplate,
} from "./helpers";

const argv = yargs(process.argv.slice(2))
  .options({
    name: { type: "string", demandOption: true },
  })
  .parseSync();

const actionName = argv.name;

const capitalizedActionName = capitalizeString(actionName);

// typename must start with lowercase and only include letters and numbers
if (!actionName.match(/^[a-z][a-zA-Z0-9]+/)) {
  throw new Error(`Invalid actionName`);
}

/*
 ** Frontend
 */

// generate the compound model and put it in the directory
const actionTemplate = fs.readFileSync(
  `scripts/templates/frontend/action.txt`,
  "utf8"
);

// write the compound model if it doesn't already exist
if (!fs.existsSync(`frontend/models/actions/${actionName}.ts`)) {
  fs.writeFileSync(
    `frontend/models/actions/${actionName}.ts`,
    processTemplate(actionTemplate, {
      actionName,
      capitalizedActionName,
    })
  );
} else {
  // if it already exists, throw error
  throw new Error(
    `File already exists: "frontend/models/actions/${actionName}.ts"`
  );
}

// add the entry to index.ts
insertStatementBeforeInFile({
  filePath: `frontend/models/actions/index.ts`,
  beforePhrase: `/** END Actions Import */`,
  statement: `export { ${actionName} } from './${actionName}'`,
});

console.log(`Done adding action: ${actionName}`);
