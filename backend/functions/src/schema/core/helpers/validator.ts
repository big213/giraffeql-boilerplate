import { userPermissionEnum } from "../../enums";
import { User } from "../../services";
import { PaginatedService } from "../services";
import { PermissionsError } from "./error";
import {
  filterPassesTest,
  isCurrentUser,
  isUserLoggedIn,
  validateQueryFields,
} from "./permissions";
import { getNestedProperty } from "./shared";

export function generateAllowIfAdminValidator(
  permissionsCheck?: (inputs) => void | Promise<void>
) {
  return async function (inputs) {
    const { req } = inputs;
    // always allow if user has */* permission
    if (req.user?.permissions.includes(userPermissionEnum["*/*"])) {
      return;
    }

    await permissionsCheck?.(inputs);
  };
}

export const ValidatorGenerators = {
  allowIfAdmin: () => generateAllowIfAdminValidator(),

  allowAlways: () => {
    return () => undefined;
  },

  allowIfOnlyFieldsRequested: (fields: string[], pathToNode?: string) => {
    return generateAllowIfAdminValidator(function ({ query, fieldPath }) {
      if (
        validateQueryFields(
          pathToNode ? getNestedProperty(query, pathToNode) : query,
          fields
        )
      ) {
        return;
      }

      throw new PermissionsError({
        message: `Prohibited fields were requested`,
        fieldPath,
      });
    });
  },

  // if requiredPermissions is array, *any* one of them will do
  allowIfUserHasPermissions: (
    requiredPermissions: userPermissionEnum | userPermissionEnum[]
  ) => {
    return generateAllowIfAdminValidator(async function ({ req }) {
      if (!req.user) throw new Error("Login Required");

      if (
        !(Array.isArray(requiredPermissions)
          ? requiredPermissions.some((requiredPermission) =>
              req.user.permissions.includes(requiredPermission)
            )
          : req.user.permissions.includes(requiredPermissions))
      ) {
        throw new Error(`Insufficient permissions to perform this action`);
      }
    });
  },

  // if fieldPath is an array, only one of those needs to pass
  allowIfRecordFieldIsCurrentUser: (
    service: PaginatedService,
    fieldPath: string | string[],
    argsPath?: string // no dot notation
  ) => {
    const fieldPathArray =
      typeof fieldPath === "string" ? [fieldPath] : fieldPath;

    return generateAllowIfAdminValidator(async function ({ req, args }) {
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
          return;
        }
      }

      return;
    });
  },

  allowIfLoggedIn: () => {
    return generateAllowIfAdminValidator(async function ({ req }) {
      if (!isUserLoggedIn(req)) throw new PermissionsError();

      return;
    });
  },

  // if fieldPath is an array of strings, run the filterPassesTest individually to make sure it's always the same filter that is passing
  allowIfFilteringByCurrentUser: (fieldPath: string | string[]) => {
    const fieldPaths = Array.isArray(fieldPath) ? fieldPath : [fieldPath];

    return generateAllowIfAdminValidator(async function ({ req, args }) {
      // if at least one of the fieldPaths passes, allow
      if (
        (
          await Promise.all(
            fieldPaths.map((fieldPath) =>
              filterPassesTest(args.filterBy, (filterObject) =>
                isCurrentUser(req, filterObject[fieldPath]?.eq)
              )
            )
          )
        ).some((res) => res)
      ) {
        return;
      }
    });
  },

  allowIfArgsFieldIsCurrentUser: (field: string) => {
    return generateAllowIfAdminValidator(async function ({ req, args }) {
      // looks up the field assuming it is a userId (this assumes that args have *not* been processed yet)
      const user = await User.getFirstSqlRecord(
        {
          select: ["id"],
          where: args[field],
        },
        true
      );

      if (isCurrentUser(req, user.id)) return;

      return;
    });
  },

  allowIfPublicOrCreatedByCurrentUser: (
    service: PaginatedService,
    fieldPrefix?: string
  ) => {
    const prefixStr = fieldPrefix ? `${fieldPrefix}.` : "";

    return generateAllowIfAdminValidator(async function ({ req, args }) {
      // (this assumes that args have *not* been processed yet)
      const record = await service.getFirstSqlRecord({
        select: [`${prefixStr}createdBy.id`, `${prefixStr}isPublic`],
        where: args,
      });

      if (!record) throw new PermissionsError();

      if (
        record[`${prefixStr}isPublic`] ||
        isCurrentUser(req, record[`${prefixStr}createdBy.id`])
      )
        return;

      throw new PermissionsError();
    });
  },
};
