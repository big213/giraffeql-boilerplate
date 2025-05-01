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
    typename: { type: "string", demandOption: true },
    name: { type: "string", demandOption: false },
    routeType: { type: "string", demandOption: true },
  })
  .parseSync();

const typename = argv.typename;

const name = argv.name ?? argv.typename;

const routeType = argv.routeType;

const capitalizedTypename = capitalizeString(typename);

const capitalizedName = capitalizeString(name);

const capitalizedRouteType = capitalizeString(routeType);

// typename must start with lowercase and only include letters and numbers
if (!typename.match(/^[a-z]+[a-zA-Z]*/)) {
  throw new Error(`Invalid typename`);
}

if (!name.match(/^[a-z]+[a-zA-Z]*/)) {
  throw new Error(`Invalid name`);
}

// route type currently must be all lowercase
if (!routeType.match(/^[a-z]*/)) {
  throw new Error(`Invalid routeType`);
}

/*
 ** Frontend
 */

// check if directory exists, if not create it (and the index.ts file)
if (!fs.existsSync(`frontend/models/views/${routeType}`)) {
  fs.mkdirSync(`frontend/models/views/${routeType}`);

  fs.writeFileSync(
    `frontend/models/views/${routeType}/index.ts`,
    `/** END ${capitalizedRouteType} View Model Import */`
  );

  insertStatementBeforeInFile({
    filePath: "frontend/models/views/index.ts",
    beforePhrase: `/** END View Model Export */`,
    statement: `export * from './${routeType}'`,
  });
}

// generate the compound model and put it in the directory
const compoundViewModelTemplate = fs.readFileSync(
  `scripts/templates/frontend/compoundView.txt`,
  "utf8"
);

// write the compound model if it doesn't already exist
if (!fs.existsSync(`frontend/models/views/${routeType}/${name}.ts`)) {
  fs.writeFileSync(
    `frontend/models/views/${routeType}/${name}.ts`,
    processTemplate(compoundViewModelTemplate, {
      typename,
      capitalizedTypename,
      routeType,
      capitalizedRouteType,
      name,
      capitalizedName,
    })
  );
} else {
  // if it already exists, throw error
  throw new Error(
    `File already exists: "frontend/models/views/${routeType}/${name}.ts"`
  );
}

// add the entry to index.ts
insertStatementBeforeInFile({
  filePath: `frontend/models/views/${routeType}/index.ts`,
  beforePhrase: `/** END ${capitalizedRouteType} View Model Import */`,
  statement: `export { ${capitalizedRouteType}${capitalizedName}View } from './${name}'`,
});

console.log(`Done adding compound view model: ${routeType}/${name}`);
