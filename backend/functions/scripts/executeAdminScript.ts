import "../src/schema";
import yargs from "yargs";
import { initializeKnex } from "../src/utils/knex";
// import { Admin } from "../schema/services";
import { development, production } from "../knexfile";
import { auditFiles } from "./adminScripts";

const argv = yargs(process.argv.slice(2))
  .options({
    prod: { type: "boolean", default: false },
  })
  .parseSync();

// set the DEV state based on the args provided
if (argv.prod) {
  delete process.env.DEV;
} else {
  process.env.DEV = "true";
}

initializeKnex(argv.prod ? production : development);

console.log(`Executing script on: ${argv.prod ? "production" : "development"}`);

(async () => {
  await auditFiles(true);

  console.log("done");
})();
