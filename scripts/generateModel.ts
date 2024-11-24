import * as fs from "fs";
import yargs from "yargs";
import {
  capitalizeString,
  insertStatementBefore,
  processTemplate,
} from "./helpers";

const argv = yargs(process.argv.slice(2))
  .options({
    name: { type: "string", demandOption: true },
    link: { type: "boolean", default: false },
    "backend-only": { type: "boolean", default: false },
  })
  .parseSync();

const typename = argv.name;

const isLink = argv.link;

const isBackendOnly = argv["backend-only"];

const capitalizedTypename = capitalizeString(typename);

// typename must start with lowercase and only include letters and numbers
if (!typename.match(/^[a-z][a-zA-Z0-9]+/)) {
  throw new Error(`Invalid typename`);
}

/*
 ** Backend
 */

// determine the prefix
const directoryPrefix = `backend/functions/src/schema/${
  isLink ? "links" : "models"
}/`;

// create the directory
if (!fs.existsSync(`${directoryPrefix}${typename}`)) {
  fs.mkdirSync(`${directoryPrefix}${typename}`);
} else {
  // if it already exists, throw error
  throw new Error("Directory already exists");
}

const templateFiles = [
  {
    templateFilename: "rootResolver.txt",
    destFilename: "rootResolver.ts",
  },
  {
    templateFilename: "service.txt",
    destFilename: "service.ts",
  },
  {
    templateFilename: "typeDef.txt",
    destFilename: "typeDef.ts",
  },
];

// write the necessary files
templateFiles.forEach((templateFileObject) => {
  const template = fs.readFileSync(
    `scripts/templates/backend/${isLink ? "link" : "normal"}/${
      templateFileObject.templateFilename
    }`,
    "utf8"
  );

  fs.writeFileSync(
    `${directoryPrefix}${typename}/${templateFileObject.destFilename}`,
    processTemplate(template, {
      typename,
      capitalizedTypename,
    })
  );
});

const modifiersArray = [
  {
    filePath: "backend/functions/src/schema/index.ts",
    modifiers: [
      {
        section: "TypeDef Import",
        statement: `import ${typename} from "./models/${typename}/typeDef"`,
        linkStatement: `import ${typename} from "./links/${typename}/typeDef"`,
      },
      {
        section: "TypeDef Set",
        statement: `allServices.${capitalizedTypename}.setTypeDef(${typename})`,
        linkStatement: `allServices.${capitalizedTypename}.setTypeDef(${typename})`,
      },
      {
        section: "RootResolver Import",
        statement: `import ${capitalizedTypename} from "./models/${typename}/rootResolver"`,
        linkStatement: `import ${capitalizedTypename} from "./links/${typename}/rootResolver"`,
      },
      {
        section: "RootResolver Set",
        statement: `allServices.${capitalizedTypename}.setRootResolvers(${capitalizedTypename});`,
        linkStatement: `allServices.${capitalizedTypename}.setRootResolvers(${capitalizedTypename});`,
      },
    ],
  },
  {
    filePath: "backend/functions/src/schema/services.ts",
    modifiers: [
      {
        section: "Service Import",
        statement: `import { ${capitalizedTypename}Service } from "./models/${typename}/service"`,
        linkStatement: `import { ${capitalizedTypename}Service } from "./links/${typename}/service"`,
      },
      {
        section: "Service Set",
        statement: `export const ${capitalizedTypename} = new ${capitalizedTypename}Service();`,
        linkStatement: `export const ${capitalizedTypename} = new ${capitalizedTypename}Service();`,
      },
    ],
  },
];

modifiersArray.forEach((modifierObj) => {
  let fileContents = fs.readFileSync(modifierObj.filePath, "utf8");

  modifierObj.modifiers.forEach((modifier) => {
    fileContents = insertStatementBefore(
      fileContents,
      `/** END${isLink ? " LINK" : ""} ${modifier.section} */`,
      isLink ? modifier.linkStatement : modifier.statement
    );
  });

  // replace the file
  fs.writeFileSync(modifierObj.filePath, fileContents);
});

/*
 ** Frontend
 */
if (!isBackendOnly) {
  // create the directory for base models
  if (!fs.existsSync(`frontend/models/base`)) {
    fs.mkdirSync(`frontend/models/base`);
  }

  // create the directory for the simple models
  if (!fs.existsSync(`frontend/models/simple`)) {
    fs.mkdirSync(`frontend/models/simple`);
  }

  // use different template depending on whether it is a link or not
  const template = fs.readFileSync(
    `scripts/templates/frontend/${isLink ? "baseLink.txt" : "base.txt"}`,
    "utf8"
  );

  // write the base model if it doesn't already exist
  if (!fs.existsSync(`frontend/models/base/${typename}.ts`)) {
    fs.writeFileSync(
      `frontend/models/base/${typename}.ts`,
      processTemplate(template, {
        typename,
        capitalizedTypename,
      })
    );
  } else {
    // if it already exists, throw error
    throw new Error("File already exists");
  }

  // write the simple model
  const simpleTemplate = fs.readFileSync(
    `scripts/templates/frontend/simple.txt`,
    "utf8"
  );

  // write the simple model if it doesn't already exist
  if (!fs.existsSync(`frontend/models/simple/${typename}.ts`)) {
    fs.writeFileSync(
      `frontend/models/simple/${typename}.ts`,
      processTemplate(simpleTemplate, {
        typename,
        capitalizedTypename,
      })
    );
  } else {
    // if it already exists, throw error
    throw new Error("File already exists");
  }

  // add the export statement to models/base/index.ts
  let fileContents = fs.readFileSync("frontend/models/base/index.ts", "utf8");

  fileContents = insertStatementBefore(
    fileContents,
    `/** END Base Model Import */`,
    `export { ${capitalizedTypename} } from './${typename}'`
  );

  // replace the file
  fs.writeFileSync("frontend/models/base/index.ts", fileContents);

  // add the export statement to models/simple/index.ts
  let simpleFileContents = fs.readFileSync(
    "frontend/models/simple/index.ts",
    "utf8"
  );

  simpleFileContents = insertStatementBefore(
    simpleFileContents,
    `/** END Simple Model Import */`,
    `export { Simple${capitalizedTypename} } from './${typename}'`
  );

  // replace the file
  fs.writeFileSync("frontend/models/simple/index.ts", simpleFileContents);
}

console.log(
  `Done adding model: ${typename} ${isBackendOnly ? ` (Backend Only)` : ""}`
);
