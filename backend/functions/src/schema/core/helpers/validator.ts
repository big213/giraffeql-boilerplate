import { ValidatorFunction } from "giraffeql/lib/types";
import { userPermissionEnum, userRoleKenum } from "../../enums";
import { User } from "../../services";
import { PaginatedService } from "../services";
import { PermissionsError } from "./error";
import {
  FilterObjectFunction,
  filterPassesTest,
  isCurrentUser,
  isUserLoggedIn,
  validateQueryFields,
} from "./permissions";
import { getNestedProperty } from "./shared";
import { ServiceFunctionInputs } from "../../../types";

function allowIfRecordFieldsPassTest(
  service: PaginatedService,
  fieldPaths: string[],
  testFn: (record, inputs: ServiceFunctionInputs) => Boolean | Promise<Boolean>,
  recordReferencePath?: string // no nested fields allowed
) {
  return async function (inputs) {
    const { req, args } = inputs;

    // (this assumes that args have *not* been processed yet)
    const record = await service.getFirstSqlRecord(
      {
        select: fieldPaths,
        where: recordReferencePath ? args[recordReferencePath] : args,
      },
      true
    );

    if (await testFn(record, inputs)) return;

    throw new PermissionsError();
  };
}

export function generateAllowIfAdminValidator(
  validatorFunction: ValidatorFunction | ValidatorFunction[]
) {
  return async function (inputs) {
    const { req } = inputs;
    // always allow if user has */* permission
    if (req.user?.permissions.includes(userPermissionEnum["*/*"])) {
      return;
    }

    const validatorFunctions = Array.isArray(validatorFunction)
      ? validatorFunction
      : [validatorFunction];

    for (const fn of validatorFunctions) {
      await fn(inputs);
    }
  };
}

// combines validator functions and returns true if any one of them is valid (evaluates sequentially)
export function generateOrValidator(validatorFunctions: ValidatorFunction[]) {
  return async function (inputs) {
    for (const validatorFunction of validatorFunctions) {
      const returnValue = await validatorFunction?.(inputs);

      // if it doesn't throw an err, return immediately. else keep checking
      if (returnValue === undefined) {
        return;
      }
    }
  };
}

export const BaseValidators = {
  allowIfAdmin: () => {
    return async function (inputs) {
      const { req } = inputs;
      // always allow if user has */* permission
      if (req.user?.permissions.includes(userPermissionEnum["*/*"])) {
        return;
      }
    };
  },

  allowAlways: () => {
    return () => undefined;
  },

  allowIfLoggedIn: () => {
    return async function ({ req }) {
      if (!isUserLoggedIn(req)) throw new PermissionsError();

      return;
    };
  },

  // if requiredPermissions is array, *any* one of them will do
  allowIfUserHasPermissions: (
    requiredPermissions: userPermissionEnum | userPermissionEnum[]
  ) => {
    return async function ({ req }) {
      if (!req.user) throw new Error("Login Required");

      if (
        !(Array.isArray(requiredPermissions)
          ? requiredPermissions.some((requiredPermission) =>
              req.user!.permissions.includes(requiredPermission)
            )
          : req.user.permissions.includes(requiredPermissions))
      ) {
        throw new Error(`Insufficient permissions to perform this action`);
      }
    };
  },

  // if array, any one of them will do
  allowIfUserHasRole: (role: userRoleKenum | userRoleKenum[]) => {
    return async function ({ req }) {
      if (!req.user) throw new Error("Login Required");

      if (
        !(Array.isArray(role)
          ? role.some((currentRole) => req.user!.role === currentRole)
          : req.user!.role === role)
      ) {
        throw new Error(`Insufficient permissions to perform this action`);
      }

      return;
    };
  },

  allowIfOnlyTheseFieldsInQuery: (fields: string[], isPaginator = false) => {
    return function ({ query, fieldPath }) {
      if (
        validateQueryFields(
          isPaginator ? getNestedProperty(query, "edges.node") : query,
          fields
        )
      ) {
        return;
      }

      throw new PermissionsError({
        message: `Prohibited fields were requested`,
        fieldPath,
      });
    };
  },

  allowIfRecordFieldsPassTest,

  allowIfFiltersPassTest: (filterObjectFn: FilterObjectFunction) => {
    return async function (inputs) {
      if (await filterPassesTest(inputs, filterObjectFn)) {
        return;
      }

      throw new PermissionsError();
    };
  },

  // if fieldPath is an array, only one of those needs to pass
  allowIfRecordFieldIsCurrentUser: (
    service: PaginatedService,
    fieldPath: string | string[],
    recordReferencePath?: string // no dot notation
  ) => {
    const fieldPathArray =
      typeof fieldPath === "string" ? [fieldPath] : fieldPath;

    return allowIfRecordFieldsPassTest(
      service,
      fieldPathArray,
      (item, { req }) =>
        fieldPathArray.some((fieldPath) => isCurrentUser(req, item[fieldPath])),
      recordReferencePath
    );
  },

  // if fieldPath is an array of strings, run the filterPassesTest individually to make sure it's always the same filter that is passing
  allowIfFilteringByCurrentUser: (fieldPath: string | string[]) => {
    const fieldPaths = Array.isArray(fieldPath) ? fieldPath : [fieldPath];

    return async function (inputs) {
      const { req, args } = inputs;
      // if at least one of the fieldPaths passes, allow
      if (
        (
          await Promise.all(
            fieldPaths.map((fieldPath) =>
              filterPassesTest(inputs, (filterObject) =>
                isCurrentUser(req, filterObject[fieldPath]?.eq)
              )
            )
          )
        ).some((res) => res)
      ) {
        return;
      }

      throw new PermissionsError();
    };
  },

  allowIfArgsFieldIsCurrentUser: (recordReferencePath: string) => {
    return async function ({ req, args }) {
      allowIfRecordFieldsPassTest(
        User,
        ["id"],
        (item, { req }) => isCurrentUser(req, item.id),
        recordReferencePath
      );
    };
  },
};
