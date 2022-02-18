import { BaseService } from ".";
import { GiraffeqlObjectType } from "giraffeql";
import { ServiceFunctionInputs } from "../../../types";
import { getObjectType } from "../helpers/resolver";
import { itemNotFoundError } from "../helpers/error";

export class SimpleService extends BaseService {
  typeDef!: GiraffeqlObjectType;

  // set typeDef
  setTypeDef(typeDef: GiraffeqlObjectType) {
    this.typeDef = typeDef;
  }

  async getRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const selectQuery = query ?? Object.assign({}, this.presets.default);

    // if no fields requested, can skip the permissions check
    if (Object.keys(selectQuery).length < 1) return { typename: this.typename };

    const results = await getObjectType({
      typename: this.typename,
      req,
      fieldPath,
      externalQuery: selectQuery,
      data,
    });

    if (results.length < 1) {
      throw itemNotFoundError(fieldPath);
    }

    return results[0];
  }
}
