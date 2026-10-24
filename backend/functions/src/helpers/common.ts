import { Request } from "express";
import { baseOrigins } from "../config";

export function getRequestOrigin(req: Request) {
  const allowedOrigins = baseOrigins
    .value()
    .split(",")
    .map((origin) => origin.trim())
    .filter((e) => e);

  // if allowedOrigins is empty, allow all origins "*"
  return allowedOrigins.length
    ? typeof req.headers.origin === "string" &&
      allowedOrigins.includes(req.headers.origin)
      ? req.headers.origin
      : allowedOrigins[0]
    : "*";
}
