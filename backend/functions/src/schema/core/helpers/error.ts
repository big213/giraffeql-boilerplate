import { GiraffeqlBaseError } from "giraffeql";

export class PermissionsError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Insufficient permissions" } = params;
    super({
      errorName: "PermissionsError",
      message,
      statusCode: 403,
    });
  }
}

export class TimeoutError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Request timed out" } = params;
    super({
      errorName: "TimeoutError",
      message,
      statusCode: 500,
    });
  }
}

export class AuthenticationError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Error authenticating" } = params;
    super({
      errorName: "AuthenticationError",
      message,
      statusCode: 401,
    });
  }
}

export class DuplicateError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Duplicate entry" } = params;
    super({
      errorName: "DuplicateError",
      message,
      statusCode: 400,
    });
  }
}

export function generateError(
  message: string,
  fieldPath?: string[],
  statusCode = 400
): GiraffeqlBaseError {
  return new GiraffeqlBaseError({
    message,
    fieldPath,
    statusCode,
  });
}
