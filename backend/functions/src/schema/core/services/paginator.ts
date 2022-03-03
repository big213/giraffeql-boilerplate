import { SimpleService, PaginatedService } from ".";

import { itemNotFoundError } from "../helpers/error";
import { generatePaginatorTypeDef } from "../generators";
import { PaginatorData, ServiceFunctionInputs } from "../../../types";

import { lookupSymbol, GiraffeqlObjectType, StringKeyObject } from "giraffeql";
import { getObjectType } from "../helpers/resolver";

export class PaginatorService extends SimpleService {
  constructor(service: PaginatedService) {
    super(service.typename + "Paginator");
    this.typeDef = new GiraffeqlObjectType(
      generatePaginatorTypeDef(service, this)
    );

    this.defaultQuery = {
      paginatorInfo: {
        total: lookupSymbol,
        count: lookupSymbol,
      },
      edges: {
        node: service.defaultQuery,
      },
    };

    this.setTypeDef(this.typeDef);

    this.getRecord = async ({
      req,
      fieldPath,
      args,
      query,
      data,
      isAdmin = false,
    }: ServiceFunctionInputs) => {
      // check if properly formed query and store the results in data
      const paginatorData: PaginatorData = {
        rootArgs: <StringKeyObject>args,
        records: !query.edges?.node
          ? <Array<StringKeyObject>>[]
          : <Array<StringKeyObject>>await service.getRecords({
              req,
              args,
              query: query.edges.node,
              fieldPath: fieldPath.concat(["edges", "node"]), // need to add these since the query field is from edges.node
              isAdmin,
              data,
            }),
      };

      const results = await getObjectType({
        typename: this.typename,
        req,
        fieldPath,
        externalQuery: query,
        data: paginatorData,
      });

      if (results.length < 1) {
        throw itemNotFoundError(fieldPath);
      }

      return results[0];
    };
  }
}
