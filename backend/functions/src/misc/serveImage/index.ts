import { onRequest } from "firebase-functions/v2/https";
import {
  serveImageBucket,
  serveImageCachePath,
  serveImageSourcePath,
} from "../../config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createHandler } = require("image-resizing");

export const serveimage = onRequest(
  createHandler({
    sourceBucket: `${serveImageBucket.value()}/${serveImageSourcePath.value()}`,
    cacheBucket: `${serveImageBucket.value()}/${serveImageCachePath.value()}`,
  })
);
