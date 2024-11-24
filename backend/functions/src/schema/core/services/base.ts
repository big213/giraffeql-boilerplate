import {
  ServiceFunctionInputs,
  AccessControlMap,
  ExternalQuery,
} from "../../../types";
import { userPermission } from "../../enums";
import { GiraffeqlRootResolverType } from "giraffeql";
import { PermissionsError } from "../helpers/error";
import { debugMode } from "../../../config";

export abstract class BaseService {
  typename: string;

  readonly defaultTypename!: string;

  rootResolvers?: { [x: string]: GiraffeqlRootResolverType };

  defaultQuery?: ExternalQuery;

  setRootResolvers(rootResolvers: {
    [x: string]: GiraffeqlRootResolverType;
  }): void {
    this.rootResolvers = rootResolvers;
  }

  // standard ones are 'get', 'getPaginator', 'update', 'create', 'delete'
  accessControl?: AccessControlMap;

  constructor(typename?: string) {
    const camelCaseTypename =
      this.constructor.name.charAt(0).toLowerCase() +
      this.constructor.name.slice(1);
    this.typename = typename ?? camelCaseTypename.replace(/Service$/, "");
  }

  async testPermissions(
    operation: string,
    { req, rootResolver, fieldPath, args, query }: ServiceFunctionInputs
  ): Promise<boolean> {
    try {
      // if logged in, attempt to verify permissions using the permissions array
      if (req.user) {
        // check against permissions array first. allow if found.
        const passablePermissionsArray = [
          userPermission.A_A,
          userPermission[this.typename + "_x"],
          userPermission[this.typename + "_" + operation],
        ];

        if (
          req.user.permissions.some((ele) =>
            passablePermissionsArray.includes(ele)
          )
        )
          return true;
      }

      // if that failed, fall back to accessControl
      // deny by default if no accessControl object
      let allowed = false;
      if (this.accessControl) {
        const validatedOperation =
          operation in this.accessControl ? operation : "*";
        // if operation not in the accessControl object, deny
        allowed = this.accessControl[validatedOperation]
          ? await this.accessControl[validatedOperation]({
              req,
              rootResolver,
              fieldPath,
              args,
              query,
            })
          : false;
      }

      if (!allowed) {
        throw new PermissionsError({
          fieldPath,
        });
      }

      return allowed;
    } catch (err: unknown) {
      // if the error is an error but not a permissions error, convert it into a permissions error with the same message
      if (err instanceof Error && !(err instanceof PermissionsError)) {
        throw new PermissionsError({
          fieldPath,
          message: err.message,
        });
      }

      throw err;
    }
  }
}
