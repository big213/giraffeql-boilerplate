import * as fs from 'fs'

const typename = process.argv[2]

const capitalizedTypename = typename.charAt(0).toUpperCase() + typename.slice(1)

if (!typename) {
  throw new Error('argument required')
}

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

// write the base model
const template = fs.readFileSync('scripts/templates/base.txt', 'utf8')

fs.writeFileSync(
  `models/base/${typename}.ts`,
  processTemplate(template, {
    typename,
    capitalizedTypename,
  })
)

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
