import { GiraffeqlRootResolverType } from "giraffeql";
import { Validators } from "../../helpers/validator";
import { alwaysAllowIfAdmin, defaultAdminOnly } from "../../../config";
import { generateAllowIfAdminValidator } from "../helpers/validator";

export abstract class BaseService {
  typename: string;

  readonly defaultTypename!: string;

  rootResolvers!: { [x: string]: GiraffeqlRootResolverType };

  setRootResolvers(rootResolvers: {
    [x: string]: GiraffeqlRootResolverType;
  }): void {
    this.rootResolvers = rootResolvers;

    // loops through all the root resolvers and sets any without an explicit validator to require admin user
    Object.values(this.rootResolvers).forEach((rootResolver) => {
      if (!rootResolver.definition.validator && defaultAdminOnly.value()) {
        rootResolver.definition.validator = Validators.allowIfAdmin();
      } else if (
        rootResolver.definition.validator &&
        alwaysAllowIfAdmin.value()
      ) {
        // if there is a validator, always allow if admin (if alwaysAllowIfAdmin is true)
        rootResolver.definition.validator = generateAllowIfAdminValidator(
          rootResolver.definition.validator
        );
      }
    });
  }

  constructor(typename?: string) {
    const camelCaseTypename =
      this.constructor.name.charAt(0).toLowerCase() +
      this.constructor.name.slice(1);
    this.typename = typename ?? camelCaseTypename.replace(/Service$/, "");
  }
}
