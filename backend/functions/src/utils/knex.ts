import knex, { Knex } from "knex";
import * as pg from "pg";
import {
  debugMode,
  pgDatabase,
  pgHost,
  pgPassword,
  pgPort,
  pgUser,
} from "../config";

// parses numeric types as numbers, as opposed to strings sometimes (for decimals, etc)
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);

// set up knex with the default params
let db: Knex;

export function getDb() {
  if (!db) {
    db = knex({
      client: "pg",
      connection: {
        host: pgHost.value(),
        user: pgUser.value(),
        password: pgPassword.value(),
        database: pgDatabase.value(),
        ...(pgPort.value() && { port: pgPort.value() }),
      },
      pool: { min: 0, max: 1 },
    });

    // if dev mode, output raw queries to console
    if (debugMode.value()) {
      db.on("query", (val) => {
        console.log(val.sql);
        console.log(val.bindings);
      });
    }
  }

  return db;
}

export const knexStatic = knex({ client: "pg" });
