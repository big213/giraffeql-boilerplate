import { PaginatedService } from "../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import * as Scalars from "../../scalars";

export function generatePaginatorTypeDef(
  service: PaginatedService
): ObjectTypeDefinition {
  return <ObjectTypeDefinition>{
    name: `${service.typename}Paginator`,
    description: "Paginator",
    fields: {
      // ...generateTypenameField(service),
      paginatorInfo: {
        type: new GiraffeqlObjectType(
          {
            name: "paginatorInfo",
            fields: {
              total: {
                type: Scalars.number,
                allowNull: false,
              },
              count: {
                type: Scalars.number,
                allowNull: false,
              },
              startCursor: {
                type: Scalars.string,
                allowNull: true,
              },
              endCursor: {
                type: Scalars.string,
                allowNull: true,
              },
            },
          },
          true
        ),
        allowNull: false,
      },
      edges: {
        type: new GiraffeqlObjectType({
          name: `${service.typename}Edge`,
          fields: {
            node: {
              type: service.typeDefLookup,
              allowNull: false,
            },
            cursor: {
              type: Scalars.string,
              allowNull: false,
            },
          },
        }),
        arrayOptions: {
          allowNullElement: false,
        },
        allowNull: false,
      },
    },
  };
}
