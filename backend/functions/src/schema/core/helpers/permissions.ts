import { BaseService } from "../services";
import { ServiceFunctionInputs } from "../../../types";
import { PermissionsError } from "./error";
import { processLookupArgs } from "./typeDef";

export function permissionsCheck(methodKey: string, processArgsBefore = false) {
  return function (
    target: BaseService,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const method = propertyDescriptor.value;

    propertyDescriptor.value = async function ({
      req,
      rootResolver,
      fieldPath,
      args,
      query,
    }: ServiceFunctionInputs) {
      let processedArgs;
      // if processArgsBefore is true, it will process all of the args prior to running the permissions check. otherwise, it will be run after the permissions are checked (this is done because checking the args could be a costly operation and may not be necessary for permissions checking)
      if (processArgsBefore) {
        processedArgs = await processLookupArgs(
          args,
          rootResolver.definition.args
        );
      }

      // if it does not pass the access control, throw an error
      if (
        !(await target.testPermissions.apply(this, [
          methodKey,
          {
            req,
            rootResolver,
            fieldPath,
            args,
            query,
          },
        ]))
      ) {
        // if returns false, fallback to a generic bad permissions error
        throw new PermissionsError({
          fieldPath,
        });
      }

      if (!processArgsBefore) {
        processedArgs = await processLookupArgs(
          args,
          rootResolver.definition.args
        );
      }

      // invoke greet() and get its return value
      const result = await method.apply(this, [
        {
          req,
          rootResolver,
          fieldPath,
          args: processedArgs,
          query,
        },
      ]);

      // return the result of invoking the method
      return result;
    };
    return propertyDescriptor;
  };
}
