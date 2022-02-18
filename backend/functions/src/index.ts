import * as functions from "firebase-functions";
import * as express from "express";
import * as admin from "firebase-admin";
admin.initializeApp();

import { initializeGiraffeql } from "giraffeql";
import "./schema";
import { env, giraffeqlOptions } from "./config";

import { validateToken, validateApiKey } from "./helpers/auth";
import { CustomSchemaGenerator } from "./helpers/schema";

const app = express();

// app.use(express.json()); -- apparently not needed on cloud functions

const allowedOrigins = ["http://localhost:3000"];
// add any additional origins
if (env.base?.origins) {
  allowedOrigins.push(
    ...env.base.origins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin)
  );
}

// extract the user ID from all requests.
app.use(async function (req, res, next) {
  try {
    // if api key provided, attempt to validate using that
    const apiKey = req.get("x-api-key");
    if (apiKey) {
      req.user = await validateApiKey(apiKey);
    } else if (req.headers.authorization) {
      req.user = await validateToken(req.headers.authorization);
    }
  } catch (err) {
    console.log(err);
  }

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

  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");

  next();
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

export const api = functions.https.onRequest(app);

export { serveImage } from "./misc/serveImage";

// additional project-specific endpoints
