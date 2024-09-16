import { serveImageCdnUrl } from "../../config";

export function generateServingUrl(location: string) {
  return `${serveImageCdnUrl.value()}/${location}`;
}
