import { GiraffeqlBaseError } from "giraffeql";

export class PermissionsError extends GiraffeqlBaseError {
  constructor({
    message,
    fieldPath,
  }: {
    message?: string;
    fieldPath?: string[];
  }) {
    super({
      errorName: "PermissionsError",
      message: message ?? "Insufficient permissions",
      fieldPath,
      statusCode: 403,
    });
  }
}

export class ItemNotFoundError extends GiraffeqlBaseError {
  constructor(params: { message?: string; fieldPath?: string[] }) {
    const { message = "Item not found" } = params;
    super({
      errorName: "ItemNotFoundError",
      message,
      statusCode: 404,
    });
  }
}

export class TimeoutError extends GiraffeqlBaseError {
  constructor({
    message,
    fieldPath,
  }: {
    message?: string;
    fieldPath?: string[];
  }) {
    super({
      errorName: "TimeoutError",
      message: message ?? "Request timed out",
      fieldPath,
      statusCode: 500,
    });
  }
}

export class AuthenticationError extends GiraffeqlBaseError {
  constructor({
    message,
    fieldPath,
  }: {
    message?: string;
    fieldPath?: string[];
  }) {
    super({
      errorName: "AuthenticationError",
      message: message ?? "Error authenticating",
      fieldPath,
      statusCode: 401,
    });
  }
}

export class DuplicateError extends GiraffeqlBaseError {
  constructor({
    message,
    fieldPath,
  }: {
    message?: string;
    fieldPath?: string[];
  }) {
    super({
      errorName: "DuplicateError",
      message: message ?? "Duplicate Entry",
      fieldPath,
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
