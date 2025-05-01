import { SimpleService } from ".";
import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import {
  GiraffeqlObjectType,
  GiraffeqlRootResolverType,
  lookupSymbol,
  ScalarDefinition,
} from "giraffeql";
import { capitalizeString } from "../helpers/shared";
import { Scalars } from "../../scalars";

export class EnumService extends SimpleService {
  enum: any;
  scalarDefinition: ScalarDefinition;

  accessControlMap?: AccessControlMap | undefined;

  // currentEnum must be any because of this weird Enum implementation
  constructor(currentEnum: any, accessControlMap?: AccessControlMap) {
    super(currentEnum.getName());

    this.enum = currentEnum;

    this.accessControlMap = accessControlMap;

    this.scalarDefinition = currentEnum.getScalarType();

    this.setTypeDef(
      new GiraffeqlObjectType({
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
        restOptions: {
          method: "get",
          route: `/${this.typename}`,
          query: { values: lookupSymbol },
        },
        allowNull: false,
        type: this.typeDef,
        resolver: (inputs) => ({
          values: this.getAllRecords(inputs),
        }),
      }),
    };
  }

  getAllRecords(inputs: ServiceFunctionInputs): (string | number)[] {
    // for kenums, fetches the numerical indices, which are serialized into their corresponding enum values
    return this.enum.type === "Enum"
      ? this.enum.values.map((ele) => ele.name)
      : this.enum.values.map((ele) => ele.index);
  }
}
