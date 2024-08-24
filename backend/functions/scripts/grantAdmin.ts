import * as knexBuilder from "knex";
import { configDotenv } from "dotenv";
configDotenv();
import yargs from "yargs";
import { userRole } from "../src/schema/enums";

const argv = yargs(process.argv.slice(2))
  .options({
    email: { type: "string", demandOption: true },
    prod: { type: "boolean", default: false },
  })
  .parseSync();

// set the DEV state based on the args provided
if (argv.prod) {
  delete process.env.DEV;
} else {
  process.env.DEV = "true";
}

import { pgOptions } from "../src/config";

export const knex = knexBuilder({
  ...pgOptions,
});

// grant the admin role to the user with that email
(async () => {
  const [user] = await knex("user").select(["id", "role"]).where({
    email: argv.email,
  });

  if (!user) throw new Error(`User with email: '${argv.email}' not found`);

  await knex("user")
    .update({
      role: userRole.ADMIN.parsed, // ADMIN enum index
    })
    .where({
      id: user.id,
    });

  console.log(
    `Done granting ADMIN role to '${argv.email}' on ${
      argv.prod ? "prod" : "dev"
    }`
  );

  // done, clean up by destroying the connection pool.
  await knex.destroy();
})();
