import * as knexBuilder from "knex";
import { getPgOptions } from "../config";
import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .options({
    email: { type: "string", demandOption: true },
    prod: { type: "boolean", default: false },
  })
  .parseSync();

const pgOptions = getPgOptions(!argv.prod);

export const knex = knexBuilder({
  ...pgOptions,
});

// grant the admin role to the usuer with that email
(async () => {
  const [user] = await knex("user").select(["id", "role"]).where({
    email: argv.email,
  });

  if (!user) throw new Error(`User with email: '${argv.email}' not found`);

  await knex("user")
    .update({
      role: 3, // ADMIN enum index
    })
    .where({
      id: user.id,
    });

  console.log(`Done granting ADMIN role to '${argv.email}'`);

  // done, clean up by destroying the connection pool.
  await knex.destroy();
})();
