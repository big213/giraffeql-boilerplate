import { BaseService } from ".";
import { GiraffeqlObjectType } from "giraffeql";
import { ServiceFunctionInputs } from "../../../types";
import { getObjectType } from "../helpers/resolver";

export class SimpleService extends BaseService {
  typeDef!: GiraffeqlObjectType;

  // set typeDef
  setTypeDef(typeDef: GiraffeqlObjectType) {
    this.typeDef = typeDef;
  }

  async getRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    // if no fields requested, can skip the permissions check
    if (Object.keys(query).length < 1) return { typename: this.typename };

    const results = await getObjectType({
      typename: this.typename,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query,
    });

    if (results.length < 1) {
      throw new Error("Item not found");
    }

    return results[0];
  }
}
