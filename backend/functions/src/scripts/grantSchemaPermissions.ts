import * as knexBuilder from "knex";
import { configDotenv } from "dotenv";
configDotenv();
import { pgOptions, pgDatabase } from "../config";
import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .options({
    user: { type: "string", demandOption: true },
  })
  .parseSync();

export const knex = knexBuilder({
  ...pgOptions,
});

const user = argv.user;

// grant the permissions to that user
(async () => {
  await knex.raw(`GRANT ALL ON SCHEMA public TO ${user};
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${user};
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${user};`);

  console.log(
    `Done granting permissions for database: '${pgDatabase.value()}' to user: '${user}'`
  );

  // done, clean up by destroying the connection pool.
  await knex.destroy();
})();
