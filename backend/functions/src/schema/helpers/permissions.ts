import { userRoleKenum, userPermissionEnum } from "../enums";
import { StringKeyObject } from "giraffeql";
import { Request } from "express";
import { NormalService } from "../core/services";
import { AccessControlFunction } from "../../types";
import { isObject } from "giraffeql/lib/helpers/base";
import { objectOnlyHasFields } from "../core/helpers/shared";

export const userRoleToPermissionsMap = {
  [userRoleKenum.ADMIN.name]: [userPermissionEnum.A_A],
  [userRoleKenum.NORMAL.name]: [],
};

export function generateItemCreatedByUserGuard(
  service: NormalService
): AccessControlFunction {
  return async function ({ req, args, fieldPath }) {
    // args should be validated already
    const validatedArgs = <any>args;
    //check if logged in
    if (!req.user) return false;

    try {
      const itemRecord = await service.getFirstSqlRecord(
        {
          select: ["createdBy"],
          where: validatedArgs.item ?? validatedArgs,
        },
        fieldPath
      );

      return itemRecord?.createdBy === req.user.id;
    } catch (err) {
      return false;
    }
  };
}

export function generateUserAdminGuard(): AccessControlFunction {
  return generateUserRoleGuard([userRoleKenum.ADMIN]);
}

export function generateUserRoleGuard(
  allowedRoles: userRoleKenum[]
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
export function filterPassesTest(filterByArray, filterFn) {
  return (
    Array.isArray(filterByArray) &&
    filterByArray.length > 0 &&
    filterByArray.every(filterFn)
  );
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
