import { defineInt, defineString, projectID } from "firebase-functions/params";

// in dev mode, SQL errors are not masked, and SQL queries/errors are logged
export const isDev = !!(process.env.FUNCTIONS_EMULATOR ?? process.env.DEV);

export const projectPath = process.env.PROJECT_PATH;

export const pgHost = isDev
  ? defineString("DEV_PG_HOST")
  : defineString("PG_HOST");
export const pgPort = isDev
  ? defineString("DEV_PG_PORT")
  : defineString("PG_PORT");
export const pgUser = isDev
  ? defineString("DEV_PG_USER")
  : defineString("PG_USER");
export const pgPassword = isDev
  ? defineString("DEV_PG_PASSWORD")
  : defineString("PG_PASSWORD");
export const pgDatabase = isDev
  ? defineString("DEV_PG_DATABASE")
  : defineString("PG_DATABASE");

export const githubToken = defineString("GITHUB_TOKEN");
export const githubRepository = defineString("GITHUB_REPOSITORY");
export const githubOrganization = defineString("GITHUB_ORGANIZATION");

export const serveImageBucket = defineString("SERVE_IMAGE_BUCKET");
export const serveImageSourcePath = defineString("SERVE_IMAGE_SOURCE_PATH");
export const serveImageCachePath = defineString("SERVE_IMAGE_CACHE_PATH");
export const serveImageTempPath = defineString("SERVE_IMAGE_TEMP_PATH");
export const serveImageCdnUrl = defineString("SERVE_IMAGE_CDN_URL");

export const baseOrigins = defineString("BASE_ORIGINS");
export const baseTimeoutSeconds = defineInt("BASE_TIMEOUT_SECONDS", {
  default: 60,
});
export const baseVersion = defineString("BASE_VERSION");

export const baseServiceAccount = defineString("BASE_SERVICE_ACCOUNT");

// add any additional origins
export const allowedOrigins = baseOrigins.value()
  ? baseOrigins
      .value()
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin)
  : [];

export const giraffeqlOptions = {
  debug: !!isDev,
  lookupValue: true,
  processEntireTree: false,
};

export const pgOptions = {
  client: "pg",
  connection: {
    host: pgHost.value(),
    user: pgUser.value(),
    password: pgPassword.value(),
    database: pgDatabase.value(),
    ...(pgPort.value() && { port: pgPort.value() }),
  },
  pool: { min: 0, max: 1 },
};
