import { BaseService } from "../services";
import { ServiceFunctionInputs } from "../../../types";
import { PermissionsError } from "./error";

export function permissionsCheck(methodKey: string) {
  return function (
    target: BaseService,
    propertyName: string,
    propertyDescriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const method = propertyDescriptor.value;

    propertyDescriptor.value = async function ({
      req,
      fieldPath,
      args,
      query,
      data,
      isAdmin = false,
    }: ServiceFunctionInputs) {
      //if it does not pass the access control, throw an error

      if (
        !(await target.testPermissions.apply(this, [
          methodKey,
          {
            req,
            fieldPath,
            args,
            query,
            data,
            isAdmin,
          },
        ]))
      ) {
        // if returns false, fallback to a generic bad permissions error
        throw new PermissionsError({
          fieldPath,
        });
      }

      // invoke greet() and get its return value
      const result = await method.apply(this, [
        {
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        },
      ]);

      // return the result of invoking the method
      return result;
    };
    return propertyDescriptor;
  };
}
