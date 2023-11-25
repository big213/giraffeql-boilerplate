import { onRequest } from "firebase-functions/v2/https";
import * as express from "express";
import { initializeApp } from "firebase-admin/app";
import { initializeGiraffeql, sendErrorResponse } from "giraffeql";
import "./schema";
import {
  allowedOrigins,
  baseTimeoutSeconds,
  baseVersion,
  giraffeqlOptions,
  pgOptions,
} from "./config";

import { validateToken, validateApiKey } from "./helpers/auth";
import { CustomSchemaGenerator } from "./helpers/schema";
import * as knex from "knex";

const conn = knex(pgOptions);

export const testFunction = onRequest(async (req, res) => {
  try {
    const result: number = await conn("user").count();
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});
initializeApp();

const app = express();

// app.use(express.json()); -- apparently not needed on cloud functions

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
  const tsSchemaGenerator = new CustomSchemaGenerator(giraffeqlOptions);
  tsSchemaGenerator.buildSchema();
  tsSchemaGenerator.processSchema();
  res.send(tsSchemaGenerator.outputSchema());
});

// runWith does not work properly with timeoutSeconds > 60 as of Firebase Cloud Functions V1
export const api = onRequest(
  {
    timeoutSeconds: baseTimeoutSeconds,
    secrets: [
      "PG_HOST",
      "PG_PORT",
      "PG_USER",
      "PG_PASSWORD",
      "PG_DATABASE",
      "GITHUB_TOKEN",
    ],
  },
  app
);

export { serveimage } from "./misc/serveImage";

// additional project-specific endpoints
