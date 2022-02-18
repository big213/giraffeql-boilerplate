import * as functions from "firebase-functions";
import { env } from "../../config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createHandler } = require("image-resizing");

export const serveImage = functions.https.onRequest(
  createHandler({
    sourceBucket: env.serve_image.source_bucket,
    cacheBucket: env.serve_image.cache_bucket,
  })
);
