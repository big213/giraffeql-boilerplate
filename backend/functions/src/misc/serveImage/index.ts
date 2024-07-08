import { onRequest } from "firebase-functions/v2/https";
import {
  allowedOrigins,
  serveImageBucket,
  serveImageCachePath,
  serveImageSourcePath,
} from "../../config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createHandler } = require("image-resizing");

const handler = createHandler({
  sourceBucket: `${serveImageBucket.value()}/${serveImageSourcePath.value()}`,
  cacheBucket: `${serveImageBucket.value()}/${serveImageCachePath.value()}`,
});

export const serveimage = onRequest((req, res) => {
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

  return handler(req, res);
});
