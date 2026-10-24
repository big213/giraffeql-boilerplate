import yargs from "yargs";
const argv = yargs(process.argv.slice(2))
  .options({
    name: { type: "string", demandOption: true },
  })
  .parseSync();

import "../src/schema";

console.log(`Executing script '${argv.name}'`);

require(`./adminScripts/${argv.name}`);

console.log(`Called script successfully`);
