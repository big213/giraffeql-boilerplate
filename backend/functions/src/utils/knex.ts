import knex from "knex";
import * as pg from "pg";
import { pgOptions, debugMode } from "../config";

// parses numeric types as numbers, as opposed to strings sometimes (for decimals, etc)
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);

// set up knex with the default params
export let db = knex({
  ...pgOptions,
});

// if dev mode, output raw queries to console
if (debugMode) {
  db.on("query", (val) => {
    console.log(val.sql);
    console.log(val.bindings);
  });
}

// for overriding the default config
export function reinitializeKnex(options: any) {
  db = knex(options);

  // if dev mode, output raw queries to console
  if (debugMode) {
    db.on("query", (val) => {
      console.log(val.sql);
      console.log(val.bindings);
    });
  }
}
