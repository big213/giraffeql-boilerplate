import * as functions from "firebase-functions";
import { env } from "../../config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createHandler } = require("image-resizing");

export const serveImage = functions.https.onRequest(
  createHandler({
    sourceBucket: `${env.serve_image.bucket}/${env.serve_image.source_path}`,
    cacheBucket: `${env.serve_image.bucket}/${env.serve_image.cache_path}`,
  })
);
