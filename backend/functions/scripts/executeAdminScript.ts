import yargs from "yargs";
const argv = yargs(process.argv.slice(2))
  .options({
    prod: { type: "boolean", default: false },
    name: { type: "string", demandOption: true },
    debug: { type: "boolean", default: false },
  })
  .parseSync();

// set the DEV state based on the args provided
if (argv.prod) {
  delete process.env.DEV;
} else {
  process.env.DEV = "true";
}

// set debug mode based on args
if (argv.debug) {
  process.env.DEBUG_MODE = "true";
} else {
  delete process.env.DEBUG_MODE;
}

import "../src/schema";
import { reinitializeKnex } from "../src/utils/knex";
import { development, production } from "../knexfile";

reinitializeKnex(argv.prod ? production : development);

console.log(
  `Executing script '${argv.name}' on: ${
    argv.prod ? "production" : "development"
  }`
);

require(`./adminScripts/${argv.name}`);

console.log(`Called script successfully`);
