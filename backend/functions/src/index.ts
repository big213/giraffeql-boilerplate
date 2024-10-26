import { onRequest } from "firebase-functions/v2/https";
import * as express from "express";
import { initializeApp } from "firebase-admin/app";
import { initializeGiraffeql, sendErrorResponse } from "giraffeql";
import "./schema";
import {
  allowedOrigins,
  baseServiceAccount,
  baseTimeoutSeconds,
  baseVersion,
  giraffeqlOptions,
} from "./config";

import { validateToken, validateApiKey } from "./helpers/auth";
import {
  generatePromptEmptyPage,
  generatePromptPage,
  generateQueryPage,
  generateSchema,
} from "./helpers/schema";

initializeApp();

const app = express();

// allows req.ip to show current user IP
app.enable("trust proxy");

// extract the user ID from all requests.
app.use(async function (req, res, next) {
  try {
    // set the start time
    req.startTime = Date.now();

    // handle origins -- only accepting string type origins.
    // if allowedOrigins is empty, allow all origins "*"
    const origin = allowedOrigins.length
      ? typeof req.headers.origin === "string" &&
        allowedOrigins.includes(req.headers.origin)
        ? req.headers.origin
        : allowedOrigins[0]
      : "*";

    res.header("Access-Control-Allow-Origin", origin);
    if (origin !== "*") {
      res.header("Vary", "Origin");
    }

    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
    );

    res.header("Access-Control-Expose-Headers", "X-Api-Version");

    res.header(
      "Access-Control-Allow-Methods",
      "PUT, POST, GET, DELETE, OPTIONS"
    );

    // if env.base.version is set, send that as a header
    if (baseVersion) {
      res.header("x-api-version", baseVersion.value());
    }

    const apiKey = req.get("x-api-key");

    if (apiKey) {
      // if api key provided, attempt to validate using that
      req.user = await validateApiKey(apiKey);
    } else if (req.headers.authorization) {
      req.user = await validateToken(req.headers.authorization);
    }

    return next();
  } catch (err: unknown) {
    return sendErrorResponse(err, res);
  }
});

app.options("*", function (req, res, next) {
  res.header("Access-Control-Max-Age", "86400");
  res.sendStatus(200);
});

initializeGiraffeql(app, giraffeqlOptions);

app.get("/schema.ts", function (req, res, next) {
  res.header("Content-Type", "text/plain");
  res.send(generateSchema(giraffeqlOptions));
});

app.get("/query", function (req, res, next) {
  res.header("Content-Type", "text/html");

  res.send(generateQueryPage(giraffeqlOptions.lookupValue));
});

app.get("/prompt", function (req, res, next) {
  res.header("Content-Type", "text/html");

  res.send(generatePromptPage(giraffeqlOptions.lookupValue));
});

app.get("/prompt-empty", function (req, res, next) {
  res.header("Content-Type", "text/html");

  res.send(generatePromptEmptyPage());
});

// runWith does not work properly with timeoutSeconds > 60 as of Firebase Cloud Functions V1
export const api = onRequest(
  {
    timeoutSeconds: baseTimeoutSeconds,
    serviceAccount: baseServiceAccount,
  },
  app
);

export { serveimage } from "./misc/serveImage";

// additional project-specific endpoints
