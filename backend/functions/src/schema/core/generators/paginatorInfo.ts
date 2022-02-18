import { BaseService, NormalService } from "../services";

import * as Scalars from "../../scalars";
import { atob, extractLastValueColumns } from "../helpers/shared";
import type { ObjectTypeDefinition } from "giraffeql";
import { generateTypenameField } from "../helpers/typeDef";
import { PaginatorData } from "../../../types";

export function generatePaginatorInfoTypeDef(
  service: NormalService,
  currentService: BaseService
): ObjectTypeDefinition {
  return <ObjectTypeDefinition>{
    name: currentService.typename,
    description: "PaginatorInfo Type",
    fields: {
      ...generateTypenameField(currentService),
      total: {
        type: Scalars.number,
        allowNull: false,
        resolver: ({ req, fieldPath, args, data }) => {
          const paginatorData = <PaginatorData>data;

          // remove any pagination params in order to fetch the total count
          const { first, after, before, last, ...validArgs } =
            paginatorData.rootArgs;
          return service.countRecords({
            req,
            fieldPath,
            args: validArgs,
            data,
          });
        },
      },
      count: {
        type: Scalars.number,
        allowNull: false,
        resolver: async ({ req, args, query, data }) => {
          const paginatorData = <PaginatorData>data;

          return paginatorData.records.length;
        },
      },
      startCursor: {
        type: Scalars.string,
        allowNull: true,
        resolver: async ({ data }) => {
          const paginatorData = <PaginatorData>data;

          if (paginatorData.records.length < 1) return null;

          // aggregate $last_value_N into last_values array
          const lastValues = extractLastValueColumns(paginatorData.records[0]);

          return atob(
            JSON.stringify({
              lastId: paginatorData.records[0].$last_id,
              lastValues,
            })
          );
        },
      },
      endCursor: {
        type: Scalars.string,
        allowNull: true,
        resolver: async ({ data }) => {
          const paginatorData = <PaginatorData>data;
          if (paginatorData.records.length < 1) return null;

          // aggregate $last_value_N into last_values array
          const lastValues = extractLastValueColumns(
            paginatorData.records[paginatorData.records.length - 1]
          );

          return atob(
            JSON.stringify({
              lastId:
                paginatorData.records[paginatorData.records.length - 1]
                  .$last_id,
              lastValues,
            })
          );
        },
      },
    },
  };
}
