import { Request } from "express";
import { StringKeyObject } from "giraffeql";
import { userPermissionEnum, userRoleKenum } from "../../enums";
import { userRoleToPermissionsMap } from "../../helpers/permissions";
import { isObject, objectOnlyHasFields } from "./shared";
import { ServiceFunctionInputs } from "../../../types";

export function parsePermissions(
  permissions: null | string[]
): userPermissionEnum[] | null {
  if (!permissions) return null;

  return permissions.map((permission) =>
    userPermissionEnum.parseNoNulls(permission)
  );
}

// gets all of the user's permissions, with inputs as raw fields from the database
export function getUserPermissions({
  role,
  permissions,
}: {
  role: unknown;
  permissions: string[] | null;
}) {
  const currentUserRole = userRoleKenum.parseNoNulls(role);

  return (userRoleToPermissionsMap[currentUserRole.name] ?? []).concat(
    parsePermissions(permissions) ?? []
  );
}

// filter the apiKey.permissions based on the userPermissionEnums

export function getAllowedApiKeyPermissions({
  userPermissionEnums,
  apiKeyPermissions,
}: {
  userPermissionEnums: userPermissionEnum[];
  apiKeyPermissions: userPermissionEnum[] | null;
}) {
  return apiKeyPermissions
    ? apiKeyPermissions.filter((permission) =>
        isPermissionAllowed({
          userPermissionEnums: userPermissionEnums,
          permission,
        })
      )
    : userPermissionEnums;
}

// is the permission allowed given the array of userPermissionEnums?
export function isPermissionAllowed({
  userPermissionEnums,
  permission,
}: {
  userPermissionEnums: userPermissionEnum[];
  permission: userPermissionEnum;
}) {
  // if the userPermissionEnums has *, allow all requested permissions
  if (userPermissionEnums.includes(userPermissionEnum["*/*"])) return true;

  // if it has the specific permission, allow
  if (userPermissionEnums.includes(permission)) return true;

  // if the permission contains "/", check to see if the wildcard permission is present
  const serviceNameMatches = permission.name.match(/^(\w+)\/(\w+)$/);
  if (serviceNameMatches) {
    const serviceName = serviceNameMatches[1];

    const wildcardPermission = userPermissionEnum[`${serviceName}/*`];

    if (wildcardPermission && userPermissionEnums.includes(wildcardPermission))
      return true;
  }

  return false;
}

export function isUserLoggedIn(req: Request) {
  if (!req.user) return false;

  return true;
}

// is the provided userId equal to the current user's ID?
export function isCurrentUser(req: Request, userId: string) {
  return req.user ? req.user.id === userId : false;
}

export type FilterObjectFunction = (
  filterObject,
  inputs?: ServiceFunctionInputs
) => Boolean | Promise<Boolean>;

// does every filterObject in the args array pass the filterFn?
export async function filterPassesTest(
  inputs: ServiceFunctionInputs,
  filterFn: FilterObjectFunction
) {
  const filterByArray = inputs.args.filterBy;
  // if empty array, return false
  if (!Array.isArray(filterByArray) || !filterByArray.length) return false;

  for (const filterObject of filterByArray) {
    if (!(await filterFn(filterObject, inputs))) return false;
  }

  // if it passed all of the conditions, return true
  return true;
}

// does the first filterObject have the fieldPath attribute, and if so, do other filterObjects also have the same exact value?
// only "eq" currently supported
export function allFiltersSynced(
  filterByArray: any,
  fieldPath: string,
  inputs: ServiceFunctionInputs
) {
  const firstValue = filterByArray[0]?.[fieldPath]?.eq;

  return filterPassesTest(inputs, (filterObject) => {
    return filterObject[fieldPath]?.eq === firstValue;
  });
}

export function validateQueryFields(
  query: any,
  allowedFields: string[],
  allowBaseFields = true
) {
  if (
    isObject(query) &&
    objectOnlyHasFields(
      query,
      allowedFields.concat(
        allowBaseFields ? ["id", "__typename", "createdAt", "updatedAt"] : []
      )
    )
  ) {
    return true;
  }

  return false;
}

// note: risky to use since it would need to be maintained when new fields are added
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
