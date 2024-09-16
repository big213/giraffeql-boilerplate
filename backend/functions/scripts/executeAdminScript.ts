import yargs from "yargs";
const argv = yargs(process.argv.slice(2))
  .options({
    prod: { type: "boolean", default: false },
    function: { type: "string", demandOption: true },
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
import * as adminScripts from "./adminScripts";

initializeKnex(argv.prod ? production : development);

console.log(`Executing script on: ${argv.prod ? "production" : "development"}`);

(async () => {
  if (typeof adminScripts[argv.function] === "function") {
    await adminScripts[argv.function]();
  } else {
    throw new Error(
      `Admin script not found in /scripts/adminScript/index.ts: '${argv.function}'`
    );
  }

  console.log("done");
})();
