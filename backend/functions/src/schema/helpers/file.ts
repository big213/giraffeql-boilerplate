import { storage } from "firebase-admin";
import { serveImageCdnUrl, serveImageSourcePath } from "../../config";

export function generateServingUrl(location: string) {
  return `${serveImageCdnUrl.value()}/${location}`;
}

// location is without serveImageSourcePath
export async function getFirebaseStorageData(location: string) {
  // verify location exists and move it into /source folder
  const bucket = storage().bucket();
  const fileReference = bucket.file(
    `${serveImageSourcePath.value()}/${location}`
  );

  const [fileData] = await fileReference.get();

  const [buffer] = await fileData.download();

  return {
    data: Buffer.from(buffer).toString("base64"),
    contentType: fileData.metadata.contentType,
    size: fileData.metadata.size,
  };
}

export async function getFirebaseStorageMetadata(location: string) {
  // verify location exists and move it into /source folder
  const bucket = storage().bucket();
  const fileReference = bucket.file(
    `${serveImageSourcePath.value()}/${location}`
  );

  const [fileData] = await fileReference.get();

  return {
    contentType: fileData.metadata.contentType,
    size: fileData.metadata.size,
  };
}

export function saveFirebaseFile({
  data,
  location,
}: {
  data: string;
  location: string;
}) {
  const bucket = storage().bucket();

  return bucket
    .file(`${serveImageSourcePath.value()}/${location}`)
    .save(Buffer.from(data, "base64"));
}
