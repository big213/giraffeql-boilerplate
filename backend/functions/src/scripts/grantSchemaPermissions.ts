import * as knexBuilder from "knex";
import { env, getPgOptions } from "../config";

const productionPgOptions = getPgOptions(false);

export const knex = knexBuilder({
  ...productionPgOptions,
});

// the default user to grant the permissions to (usually 'postgres')
const pgUser = env.pg_dev.user;

// grant the permissions to that user
(async () => {
  await knex.raw(`GRANT ALL ON SCHEMA public TO ${pgUser};
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${pgUser};
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${pgUser};`);

  console.log(
    `Done granting permissions for database: '${env.pg.database}' to user: '${pgUser}'`
  );

  // done, clean up by destroying the connection pool.
  await knex.destroy();
})();
