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
    "skip-backend": { type: "boolean", default: false },
    "skip-frontend": { type: "boolean", default: false },
  })
  .parseSync();

const typename = argv.name;

const isLink = argv.link;

const skipBackend = argv["skip-backend"];

const skipFrontend = argv["skip-frontend"];

const capitalizedTypename = capitalizeString(typename);

// typename must start with lowercase and only include letters and numbers
if (!typename.match(/^[a-z][a-zA-Z0-9]+/)) {
  throw new Error(`Invalid typename`);
}

/*
 ** Backend
 */

if (!skipBackend) {
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
}

/*
 ** Frontend
 */
if (!skipFrontend) {
  // create the directory for base view models
  if (!fs.existsSync(`frontend/models/views/base`)) {
    fs.mkdirSync(`frontend/models/views/base`);
  }

  // create the directory for the entities
  if (!fs.existsSync(`frontend/models/entities`)) {
    fs.mkdirSync(`frontend/models/entities`);
  }

  // use different template depending on whether it is a link or not
  const template = fs.readFileSync(
    `scripts/templates/frontend/${isLink ? "baseLink.txt" : "base.txt"}`,
    "utf8"
  );

  // write the base model if it doesn't already exist
  if (!fs.existsSync(`frontend/models/views/base/${typename}.ts`)) {
    fs.writeFileSync(
      `frontend/models/views/base/${typename}.ts`,
      processTemplate(template, {
        typename,
        capitalizedTypename,
      })
    );
  } else {
    // if it already exists, throw error
    throw new Error("File already exists");
  }

  // write the entity model
  const entityTemplate = fs.readFileSync(
    `scripts/templates/frontend/entity.txt`,
    "utf8"
  );

  // write the entity model if it doesn't already exist
  if (!fs.existsSync(`frontend/models/entities/${typename}.ts`)) {
    fs.writeFileSync(
      `frontend/models/entities/${typename}.ts`,
      processTemplate(entityTemplate, {
        typename,
        capitalizedTypename,
      })
    );
  } else {
    // if it already exists, throw error
    throw new Error("File already exists");
  }

  // add the export statement to models/views/base/index.ts
  let fileContents = fs.readFileSync(
    "frontend/models/views/base/index.ts",
    "utf8"
  );

  fileContents = insertStatementBefore(
    fileContents,
    `/** END Base View Model Import */`,
    `export { Base${capitalizedTypename}View } from './${typename}'`
  );

  // replace the file
  fs.writeFileSync("frontend/models/views/base/index.ts", fileContents);

  // add the export statement to models/entities/index.ts
  let entityFileContents = fs.readFileSync(
    "frontend/models/entities/index.ts",
    "utf8"
  );

  entityFileContents = insertStatementBefore(
    entityFileContents,
    `/** END Entity Model Import */`,
    `export { ${capitalizedTypename}Entity } from './${typename}'`
  );

  // replace the file
  fs.writeFileSync("frontend/models/entities/index.ts", entityFileContents);
}

console.log(
  `Done adding model: ${typename}${!skipBackend ? ` (Backend Added)` : ""}${
    !skipFrontend ? ` (Frontend Added)` : ""
  }`
);
