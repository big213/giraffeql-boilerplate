import { readFileSync, writeFileSync } from "fs";

// parses templateString and replaces with any params
export function processTemplate(
  templateString: string,
  params: { [x in string]: string }
) {
  let templateStringModified = templateString;
  Object.entries(params).forEach(([key, value]) => {
    const currentRegex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    templateStringModified = templateStringModified.replace(
      currentRegex,
      value
    );
  });

  return templateStringModified;
}

export function insertStatementBefore(
  str: string,
  beforePhrase: string,
  statement: string
) {
  let strModified = str;
  const typepDefImportIndex = strModified.indexOf(beforePhrase);

  if (typepDefImportIndex === -1)
    throw new Error(`Phrase '${beforePhrase}' not found`);

  strModified =
    strModified.slice(0, typepDefImportIndex) +
    statement +
    "\n" +
    strModified.slice(typepDefImportIndex);

  return strModified;
}

export function capitalizeString(str: string | undefined): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

export function insertStatementBeforeInFile({
  filePath,
  beforePhrase,
  statement,
}: {
  filePath: string;
  beforePhrase: string;
  statement: string;
}) {
  // add the export statement to models/index.ts
  let fileContents = readFileSync(filePath, "utf8");

  fileContents = insertStatementBefore(fileContents, beforePhrase, statement);

  // replace the file
  writeFileSync(filePath, fileContents);
}
