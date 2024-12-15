import { userRole, userPermission } from "../enums";
import { Request } from "express";
import { PaginatedService } from "../core/services";
import { AccessControlFunction, StringKeyObject } from "../../types";
import { isObject } from "giraffeql/lib/helpers/base";
import { objectOnlyHasFields } from "../core/helpers/shared";
import { User } from "../services";

export const userRoleToPermissionsMap = {
  [userRole.ADMIN.name]: [userPermission.A_A],
  [userRole.NORMAL.name]: [],
};

export function generateUserAdminGuard(): AccessControlFunction {
  return generateUserRoleGuard([userRole.ADMIN]);
}

export function generateUserRoleGuard(
  allowedRoles: userRole[]
): AccessControlFunction {
  return async function ({ req }) {
    //check if logged in
    if (!req.user) return false;

    try {
      if (!req.user.role) return false;
      return allowedRoles.includes(req.user.role);
    } catch (err) {
      return false;
    }
  };
}

// is the user logged in?
export function userLoggedIn(req: Request) {
  if (!req.user) throw new Error("User login required");

  return true;
}

export function isUserLoggedIn(req: Request) {
  if (!req.user) return false;

  return true;
}

// is the provided userId equal to the current user's ID?
export function isCurrentUser(req: Request, userId: string) {
  return req.user ? req.user.id === userId : false;
}

// does every filterObject in the args array pass the filterFn?
export async function filterPassesTest(filterByArray, filterFn) {
  // if empty array, return false
  if (!Array.isArray(filterByArray) || !filterByArray.length) return false;

  for (const filterObject of filterByArray) {
    if (!(await filterFn(filterObject))) return false;
  }

  // if it passed all of the conditions, return true
  return true;
}

// does the first filterObject have the fieldPath attribute, and if so, do other filterObjects also have the same exact value?
// only "eq" currently supported
export function allFiltersSynced(filterByArray: any, fieldPath: string) {
  const firstValue = filterByArray[0]?.[fieldPath]?.eq;

  return filterPassesTest(filterByArray, (filterObject) => {
    return filterObject[fieldPath]?.eq === firstValue;
  });
}

export function validateQueryFields(query: any, allowedFields: string[]) {
  if (isObject(query) && objectOnlyHasFields(query, allowedFields)) {
    return true;
  }

  return false;
}

export function queryExcludesFields(
  query: StringKeyObject | null | undefined,
  fields: string[]
) {
  // if query is falsey, return false
  if (!query) {
    return false;
  }

  return !fields.some((field) => field in query);
}

// if fieldPath is an array, only one of those needs to pass
export function allowIfRecordFieldIsCurrentUserFn(
  service: PaginatedService,
  fieldPath: string | string[],
  argsPath?: string // no dot notation
) {
  const fieldPathArray =
    typeof fieldPath === "string" ? [fieldPath] : fieldPath;

  return async function ({ req, args }) {
    // (this assumes that args have *not* been processed yet)
    const record = await service.getFirstSqlRecord(
      {
        select: fieldPathArray,
        where: argsPath ? args[argsPath] : args,
      },
      true
    );

    for (const currentPath of fieldPathArray) {
      if (isCurrentUser(req, record[currentPath])) {
        return true;
      }
    }

    return false;
  };
}

export function allowIfFilteringByCurrentUserFn(fieldPath: string) {
  return async function ({ req, args }) {
    if (
      await filterPassesTest(args.filterBy, (filterObject) => {
        return isCurrentUser(req, filterObject[fieldPath]?.eq);
      })
    ) {
      return true;
    }

    return false;
  };
}

export function allowIfLoggedInFn() {
  return async function ({ req }) {
    if (!isUserLoggedIn(req)) return false;

    return true;
  };
}

export function allowIfArgsFieldIsCurrentUserFn(field: string) {
  return async function ({ req, args }) {
    // looks up the field assuming it is a userId (this assumes that args have *not* been processed yet)
    const user = await User.getFirstSqlRecord(
      {
        select: ["id"],
        where: args[field],
      },
      true
    );

    if (isCurrentUser(req, user.id)) return true;

    return false;
  };
}

export function allowIfPublicOrCreatedByCurrentUser(
  service: PaginatedService,
  fieldPrefix?: string
) {
  const prefixStr = fieldPrefix ? `${fieldPrefix}.` : "";

  return async function ({ req, args }) {
    // (this assumes that args have *not* been processed yet)
    const record = await service.getFirstSqlRecord({
      select: [`${prefixStr}createdBy.id`, `${prefixStr}isPublic`],
      where: args,
    });

    if (!record) return false;

    if (
      record[`${prefixStr}isPublic`] ||
      isCurrentUser(req, record[`${prefixStr}createdBy.id`])
    )
      return true;

    return false;
  };
}

// if requiredPermissions is array, *any* one of them will do
export function allowIfUserHasPermissions(
  requiredPermissions: userPermission | userPermission[]
) {
  return async function ({ req }) {
    if (!req.user) throw new Error("Login Required");

    return Array.isArray(requiredPermissions)
      ? requiredPermissions.some((requiredPermission) =>
          req.user.permissions.includes(requiredPermission)
        )
      : req.user.permissions.includes(requiredPermissions);
  };
}
