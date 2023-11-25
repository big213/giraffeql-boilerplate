// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

export const production = {
  client: "pg",
  connection: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ...(process.env.PG_PORT && { port: process.env.PG_PORT }),
  },
  pool: { min: 0, max: 1 },
  migrations: {
    tableName: "knex_migrations",
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};

export const development = {
  client: "pg",
  connection: {
    host: process.env.DEV_PG_HOST,
    user: process.env.DEV_PG_USER,
    password: process.env.DEV_PG_PASSWORD,
    database: process.env.DEV_PG_DATABASE,
    ...(process.env.DEV_PG_PORT && { port: process.env.DEV_PG_PORT }),
  },
  pool: { min: 0, max: 1 },
  migrations: {
    tableName: "knex_migrations",
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};
