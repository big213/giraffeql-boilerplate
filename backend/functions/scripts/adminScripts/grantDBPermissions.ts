import { pgDatabase, pgUser } from "../../lib/config";
import { getDb } from "../../src/utils/knex";

(async function () {
  const targetUser = "postgres";

  console.log(
    `Attempting to grant permissions for database: '${pgDatabase.value()}' to user: '${targetUser}' (acting as user: '${pgUser.value()}')`
  );

  await getDb().raw(`GRANT ALL ON SCHEMA public TO ${targetUser};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${targetUser} WITH GRANT OPTION;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${targetUser} WITH GRANT OPTION;`);

  console.log(
    `Done granting permissions for database: '${pgDatabase.value()}' to user: '${targetUser}'`
  );
})();
