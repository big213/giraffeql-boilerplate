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
    kenum: { type: "boolean", default: false },
  })
  .parseSync();

const enumName = argv.name;

const isKenum = argv.kenum;

const capitalizedEnumName = capitalizeString(enumName);

const enumNameWithSuffix = `${enumName}${isKenum ? "Kenum" : "Enum"}`;

// typename must start with lowercase and only include letters and numbers
if (!enumName.match(/^[a-z][a-zA-Z0-9]+/)) {
  throw new Error(`Invalid name`);
}

const template = fs.readFileSync(
  `scripts/templates/backend/enum/${isKenum ? "kenum.txt" : "enum.txt"}`,
  "utf8"
);

// generate the file in the enum directory
fs.writeFileSync(
  `backend/functions/src/schema/enums/${enumName}.ts`,
  processTemplate(template, {
    enumNameWithSuffix,
  })
);

// modify the enums/index.ts file
const modifiersArray = [
  {
    filePath: "backend/functions/src/schema/enums/index.ts",
    modifiers: [
      {
        section: "ENUM Import",
        statement: `export { ${enumNameWithSuffix} } from "./${enumName}"`,
      },
    ],
  },
  {
    filePath: "backend/functions/src/schema/scalars/index.ts",
    modifiers: [
      {
        section: "ENUM Scalar Types",
        statement: `${enumName}: enums.${enumNameWithSuffix}.getScalarType(),`,
      },
    ],
  },
  {
    filePath: "backend/functions/src/schema/services.ts",
    modifiers: [
      {
        section: "ENUM Service Set",
        statement: `export const ${capitalizedEnumName} = new EnumService(enums.${enumNameWithSuffix});`,
      },
    ],
  },
  {
    filePath: "frontend/services/dropdown.ts",
    modifiers: [
      {
        section: "Enum Getters",
        statement: `export const get${capitalizedEnumName}EnumValues = generateMemoizedEnumGetter('get${capitalizedEnumName}EnumPaginator')`,
      },
    ],
  },
];

modifiersArray.forEach((modifierObj) => {
  let fileContents = fs.readFileSync(modifierObj.filePath, "utf8");

  modifierObj.modifiers.forEach((modifier) => {
    fileContents = insertStatementBefore(
      fileContents,
      `/** END ${modifier.section} */`,
      modifier.statement
    );
  });

  // replace the file
  fs.writeFileSync(modifierObj.filePath, fileContents);
});

console.log(`Done adding ${isKenum ? "Kenum" : "Enum"}: ${enumName}`);
