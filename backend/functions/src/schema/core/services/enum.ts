import { SimpleService } from ".";
import { ServiceFunctionInputs } from "../../../types";
import {
  GiraffeqlObjectType,
  GiraffeqlRootResolverType,
  ObjectTypeDefinition,
  lookupSymbol,
} from "giraffeql";
import * as Scalars from "../../scalars";
import { capitalizeString } from "../helpers/shared";

export class EnumService extends SimpleService {
  enum;

  defaultQuery? = {
    values: lookupSymbol,
  };

  constructor(currentEnum: any) {
    super(currentEnum.getName());

    this.enum = currentEnum;

    this.setTypeDef(
      new GiraffeqlObjectType(<ObjectTypeDefinition>{
        name: this.typename,
        description: "EnumPaginator",
        fields: {
          values: {
            type: Scalars[this.typename],
            arrayOptions: {
              allowNullElement: false,
            },
            allowNull: false,
          },
        },
      })
    );

    const capitalizedClass = capitalizeString(this.typename);
    const methodName = `get${capitalizedClass}EnumPaginator`;
    this.rootResolvers = {
      [methodName]: new GiraffeqlRootResolverType({
        name: methodName,
        ...(this.defaultQuery && {
          restOptions: {
            method: "get",
            route: "/" + this.typename,
            query: this.defaultQuery,
          },
        }),
        allowNull: false,
        type: this.typeDef,
        resolver: (inputs) => ({
          values: this.getAllRecords(inputs),
        }),
      }),
    };
  }

  getAllRecords(inputs: ServiceFunctionInputs): (number | string)[] {
    return this.enum.values.map((ele) => ele.name);
  }
}
