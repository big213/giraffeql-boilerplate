import {
  defineBoolean,
  defineInt,
  defineString,
} from "firebase-functions/params";

// in dev mode, SQL errors are not masked, and SQL queries/errors are logged
export const debugMode = defineBoolean("DEBUG_MODE");
export const defaultAdminOnly = defineBoolean("DEFAULT_ADMIN_ONLY");
export const alwaysAllowIfAdmin = defineBoolean("ALWAYS_ALLOW_IF_ADMIN");

export const projectPath = process.env.PROJECT_PATH;

export const pgHost = defineString("PG_HOST");
export const pgPort = defineString("PG_PORT");
export const pgUser = defineString("PG_USER");
export const pgPassword = defineString("PG_PASSWORD");
export const pgDatabase = defineString("PG_DATABASE");

export const githubToken = defineString("GITHUB_TOKEN");
export const githubRepository = defineString("GITHUB_REPOSITORY");
export const githubOrganization = defineString("GITHUB_ORGANIZATION");

export const serveImageBucket = defineString("SERVE_IMAGE_BUCKET");
export const serveImageSourcePath = defineString("SERVE_IMAGE_SOURCE_PATH");
export const serveImageCachePath = defineString("SERVE_IMAGE_CACHE_PATH");
export const serveImageTempPath = defineString("SERVE_IMAGE_TEMP_PATH");
export const serveImageCdnUrl = defineString("SERVE_IMAGE_CDN_URL");

// payment-related (optional)
export const stripeSecretKey = defineString("STRIPE_SECRET_KEY");
export const stripeSiteUrl = defineString("STRIPE_SITE_URL");
export const paypalClientId = defineString("PAYPAL_CLIENT_ID");
export const paypalClientSecret = defineString("PAYPAL_CLIENT_SECRET");
export const paypalApiUrl = defineString("PAYPAL_API_URL");

export const baseOrigins = defineString("BASE_ORIGINS");
export const baseTimeoutSeconds = defineInt("BASE_TIMEOUT_SECONDS", {
  default: 60,
});
export const baseVersion = defineString("BASE_VERSION");

export const baseServiceAccount = defineString("BASE_SERVICE_ACCOUNT");
export const baseTimezone = defineString("BASE_TIMEZONE");

export const giraffeqlOptions = {
  debug: true,
  lookupValue: true,
  processEntireTree: false,
};
