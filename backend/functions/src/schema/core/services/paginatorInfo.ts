import { NormalService, SimpleService } from ".";
import { itemNotFoundError } from "../helpers/error";
import { generatePaginatorInfoTypeDef } from "../generators";
import { ServiceFunctionInputs } from "../../../types";
import { lookupSymbol, GiraffeqlObjectType } from "giraffeql";
import { getObjectType } from "../helpers/resolver";

export class PaginatorInfoService extends SimpleService {
  constructor(service: NormalService) {
    super("paginatorInfo");
    this.typeDef = new GiraffeqlObjectType(
      generatePaginatorInfoTypeDef(service, this),
      true
    );

    this.getRecord = async ({
      req,
      fieldPath,
      args,
      query,
      data = {},
      isAdmin = false,
    }: ServiceFunctionInputs) => {
      const results = await getObjectType({
        typename: this.typename,
        req,
        fieldPath,
        externalQuery: query,
        data,
        externalTypeDef: this.typeDef, // must pass the specific typeDef for this Paginator
      });

      if (results.length < 1) {
        throw itemNotFoundError(fieldPath);
      }

      return results[0];
    };
  }
}
