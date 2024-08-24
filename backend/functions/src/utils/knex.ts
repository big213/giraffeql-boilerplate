import * as knexBuilder from "knex";
import { pgOptions, debugMode } from "../config";

// set up knex with the default params
export let knex = knexBuilder({
  ...pgOptions,
});

export function initializeKnex(options: any) {
  knex = knexBuilder(options);
}

// if dev mode, output raw queries to console
if (debugMode) {
  knex.on("query", (val) => {
    console.log(val.sql);
    console.log(val.bindings);
  });
}
