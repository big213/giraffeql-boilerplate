import * as knexBuilder from "knex";
import { pgOptions, pgDatabase, pgUser } from "../config";

export const knex = knexBuilder({
  ...pgOptions,
});

// grant the permissions to that user
(async () => {
  await knex.raw(`GRANT ALL ON SCHEMA public TO ${pgUser.value()};
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${pgUser.value()};
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${pgUser.value()};`);

  console.log(
    `Done granting permissions for database: '${pgDatabase.value()}' to user: '${pgUser.value()}'`
  );

  // done, clean up by destroying the connection pool.
  await knex.destroy();
})();
