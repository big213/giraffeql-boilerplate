import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import { userPermission } from "../../enums";
import { GiraffeqlRootResolverType } from "giraffeql";
import { PermissionsError } from "../helpers/error";

export abstract class BaseService {
  typename: string;

  readonly defaultTypename!: string;

  rootResolvers?: { [x: string]: GiraffeqlRootResolverType };

  setRootResolvers(rootResolvers: {
    [x: string]: GiraffeqlRootResolverType;
  }): void {
    this.rootResolvers = rootResolvers;
  }

  // standard ones are 'get', 'getPaginator', 'update', 'create', 'delete'
  accessControlMap?: AccessControlMap;

  constructor(typename?: string) {
    const camelCaseTypename =
      this.constructor.name.charAt(0).toLowerCase() +
      this.constructor.name.slice(1);
    this.typename = typename ?? camelCaseTypename.replace(/Service$/, "");
  }

  async testPermissions(
    permissionKey: string,
    { req, rootResolver, fieldPath, args, query }: ServiceFunctionInputs
  ): Promise<boolean> {
    try {
      // if logged in, attempt to verify permissions using the permissions array
      if (req.user) {
        // check against permissions array first. if the user has any of these permissions, allow
        const passablePermissionsArray = [
          userPermission["*/*"],
          userPermission[`${this.typename}/*`],
          userPermission[`${this.typename}/${permissionKey}`],
        ].filter((e) => e);

        if (
          req.user.permissions.some((ele) =>
            passablePermissionsArray.includes(ele)
          )
        ) {
          return true;
        }
      }

      // if that failed, fall back to accessControlMap map

      // if no access control object, throw err
      if (!this.accessControlMap) {
        throw new Error(
          `Access control map not defined for type: '${this.typename}'`
        );
      }

      // if the permissionKey doesn't exist in the accessControlMap object, default to "*/*"
      const accessControlMapFn =
        this.accessControlMap[
          permissionKey in this.accessControlMap ? permissionKey : "*/*"
        ];

      if (!accessControlMapFn) {
        throw new Error(
          `Access control function (or fallback) not found on type: '${this.typename}' for permissionKey: '${permissionKey}'`
        );
      }

      // if operation not in the accessControlMap object, deny
      if (
        !(await accessControlMapFn({
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        }))
      ) {
        throw new Error(
          `Access control failed for permissionKey: '${permissionKey}'`
        );
      }

      return true;
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
