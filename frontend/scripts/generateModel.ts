import * as fs from 'fs'
import yargs from 'yargs'

const argv = yargs(process.argv.slice(2))
  .options({
    name: { type: 'string', demandOption: true },
  })
  .parseSync()

const typename = argv.name

const capitalizedTypename = typename.charAt(0).toUpperCase() + typename.slice(1)

// parses templateString and replaces with any params
function processTemplate(
  templateString: string,
  params: { [x in string]: string }
) {
  let templateStringModified = templateString
  Object.entries(params).forEach(([key, value]) => {
    const currentRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    templateStringModified = templateStringModified.replace(currentRegex, value)
  })

  return templateStringModified
}

function insertStatementBefore(
  str: string,
  beforePhrase: string,
  statement: string
) {
  let strModified = str
  const typepDefImportIndex = strModified.indexOf(beforePhrase)

  if (typepDefImportIndex === -1)
    throw new Error(`Phrase '${beforePhrase}' not found`)

  strModified =
    strModified.slice(0, typepDefImportIndex) +
    statement +
    '\n' +
    strModified.slice(typepDefImportIndex)

  return strModified
}

// create the directory for base models
if (!fs.existsSync(`models/base`)) {
  fs.mkdirSync(`models/base`)
}

const template = fs.readFileSync('scripts/templates/base.txt', 'utf8')

// write the base model if it doesn't already exist
if (!fs.existsSync(`models/base/${typename}.ts`)) {
  fs.writeFileSync(
    `models/base/${typename}.ts`,
    processTemplate(template, {
      typename,
      capitalizedTypename,
    })
  )
} else {
  // if it already exists, throw error
  throw new Error('File already exists')
}

// add the export statement to models/base/index.ts
let fileContents = fs.readFileSync('models/base/index.ts', 'utf8')

fileContents = insertStatementBefore(
  fileContents,
  `/** END Base Model Import */`,
  `export { ${capitalizedTypename} } from './${typename}'`
)

// replace the file
fs.writeFileSync('models/base/index.ts', fileContents)

console.log(`Done adding ${typename} model`)
