import { onRequest } from "firebase-functions/v2/https";
import {
  serveImageBucket,
  serveImageCachePath,
  serveImageSourcePath,
} from "../../config";
import { getRequestOrigin } from "../../helpers/common";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createHandler } = require("image-resizing");

const handler = createHandler({
  sourceBucket: `${serveImageBucket}/${serveImageSourcePath}`,
  cacheBucket: `${serveImageBucket}/${serveImageCachePath}`,
});

export const serveimage = onRequest((req, res) => {
  const origin = getRequestOrigin(req);

  res.header("Access-Control-Allow-Origin", origin);

  if (origin !== "*") {
    res.header("Vary", "Origin");
  }

  return handler(req, res);
});
