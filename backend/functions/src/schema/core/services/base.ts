import { GiraffeqlRootResolverType } from "giraffeql";
import { ValidatorGenerators } from "../helpers/validator";
import { defaultAdminOnly } from "../../../config";

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
        rootResolver.definition.validator = ValidatorGenerators.allowIfAdmin();
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
