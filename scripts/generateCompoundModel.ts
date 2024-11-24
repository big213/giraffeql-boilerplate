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
    routeType: { type: "string", demandOption: true },
  })
  .parseSync();

const typename = argv.name;

const routeType = argv.routeType;

const capitalizedTypename = capitalizeString(typename);

const capitalizedRouteType = capitalizeString(routeType);

// typename must start with lowercase and only include letters and numbers
if (!typename.match(/^[a-z][a-zA-Z0-9]+/)) {
  throw new Error(`Invalid typename`);
}

// route type
if (!routeType.match(/^[a-z][a-zA-Z]+/)) {
  throw new Error(`Invalid routeType`);
}

/*
 ** Frontend
 */

// check if directory exists, if not create it (and the index.ts file)
if (!fs.existsSync(`frontend/models/compound/${routeType}`)) {
  fs.mkdirSync(`frontend/models/compound/${routeType}`);

  fs.writeFileSync(
    `frontend/models/compound/${routeType}/index.ts`,
    `/** END Compound Model Import */`
  );

  insertStatementBeforeInFile({
    filePath: "frontend/models/base/index.ts",
    beforePhrase: `/** END Compound Model Export */`,
    statement: `export * from './compound/${routeType}'`,
  });
}

// generate the compound model and put it in the directory
const compoundModelTemplate = fs.readFileSync(
  `scripts/templates/frontend/compound.txt`,
  "utf8"
);

// write the compound model if it doesn't already exist
if (!fs.existsSync(`frontend/models/compound/${routeType}/${typename}.ts`)) {
  fs.writeFileSync(
    `frontend/models/compound/${routeType}/${typename}.ts`,
    processTemplate(compoundModelTemplate, {
      typename,
      capitalizedTypename,
      routeType,
      capitalizedRouteType,
    })
  );
} else {
  // if it already exists, throw error
  throw new Error(
    `File already exists: "frontend/models/compound/${routeType}/${typename}.ts"`
  );
}

// add the entry to index.ts
insertStatementBeforeInFile({
  filePath: `frontend/models/compound/${routeType}/index.ts`,
  beforePhrase: `/** END Compound Model Import */`,
  statement: `export { ${capitalizedRouteType}${capitalizedTypename} } from './${typename}'`,
});

console.log(`Done adding compound model: ${routeType}/${typename}`);
