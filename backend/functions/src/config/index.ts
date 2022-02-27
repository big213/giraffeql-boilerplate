import * as functions from "firebase-functions";

export const isDev = process.env.FUNCTIONS_EMULATOR ?? process.env.DEV;

export const env = isDev ? require("../../../env.json") : functions.config();

export const giraffeqlOptions = {
  debug: !!isDev,
  lookupValue: true,
  processEntireTree: false,
};

export function getPgOptions(dev: boolean) {
  const pgEnv = dev ? env.pg_dev : env.pg;
  return {
    client: "pg",
    connection: {
      host: pgEnv.host,
      user: pgEnv.user,
      password: pgEnv.password,
      database: pgEnv.database,
      ...(pgEnv.port && { port: pgEnv.port }),
    },
    pool: { min: 0, max: 1 },
  };
}

export const pgOptions = getPgOptions(!!isDev);
