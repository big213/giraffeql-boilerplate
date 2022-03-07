import { GiraffeqlBaseError } from "giraffeql";

export class PermissionsError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Insufficient permissions", fieldPath = [] } = params;
    super({
      errorName: "PermissionsError",
      message,
      fieldPath,
      statusCode: 403,
    });
  }
}

export class TimeoutError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Request timed out", fieldPath = [] } = params;
    super({
      errorName: "TimeoutError",
      message,
      fieldPath,
      statusCode: 500,
    });
  }
}

export class AuthenticationError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Error authenticating", fieldPath = [] } = params;
    super({
      errorName: "AuthenticationError",
      message,
      fieldPath,
      statusCode: 401,
    });
  }
}

export function generateError(
  message: string,
  fieldPath: string[],
  statusCode = 400
): GiraffeqlBaseError {
  return new GiraffeqlBaseError({
    message,
    fieldPath,
    statusCode,
  });
}

export function itemNotFoundError(fieldPath: string[]): GiraffeqlBaseError {
  return generateError("Record was not found", fieldPath, 404);
}
