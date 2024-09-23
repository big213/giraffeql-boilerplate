import yargs from "yargs";
const argv = yargs(process.argv.slice(2))
  .options({
    prod: { type: "boolean", default: false },
    name: { type: "string", demandOption: true },
  })
  .parseSync();

// set the DEV state based on the args provided
if (argv.prod) {
  delete process.env.DEV;
} else {
  process.env.DEV = "true";
}

// always debug mode on
process.env.DEBUG_MODE = "true";

import "../src/schema";
import { initializeKnex } from "../src/utils/knex";
import { development, production } from "../knexfile";

initializeKnex(argv.prod ? production : development);

console.log(
  `Executing script '${argv.name}' on: ${
    argv.prod ? "production" : "development"
  }`
);

require(`./adminScripts/${argv.name}`);

console.log(`Called script successfully`);
