import { storage } from "firebase-admin";
import { serveImageCdnUrl, serveImageSourcePath } from "../../config";

export function generateServingUrl(location: string) {
  return `${serveImageCdnUrl.value()}/${encodeURIComponent(location)}`;
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
    location,
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

export function getFilenameFromUrl(url: string): string {
  // Provide a dummy base to support relative paths like '/images/photo.png'
  const parsed = new URL(url, "https://example.com");
  const segment = parsed.pathname.split("/").filter(Boolean).pop();

  if (!segment) {
    throw new Error(`Unable to retrieve filename`);
  }
  return decodeURIComponent(segment);
}
