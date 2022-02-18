import { BaseService, NormalService } from "../services";
import { User } from "../../services";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateJoinableField,
  generateTypenameField,
} from "../helpers/typeDef";
import { ObjectTypeDefinition, ObjectTypeDefinitionField } from "giraffeql";

type ServicesObjectMap = {
  [x: string]: {
    allowNull?: boolean;
    service: NormalService;
    field?: string; // sql alias for the field, e.g. if it has CAPS
  };
};

export function generateLinkTypeDef(
  servicesObjectMap: ServicesObjectMap,
  currentService: BaseService,
  additionalFields?: { [x: string]: ObjectTypeDefinitionField }
): ObjectTypeDefinition {
  const typeDefFields = {};

  for (const field in servicesObjectMap) {
    typeDefFields[field] = generateJoinableField({
      service: servicesObjectMap[field].service,
      allowNull: servicesObjectMap[field].allowNull ?? false,
      sqlOptions: {
        unique: "compositeIndex",
        ...(servicesObjectMap[field].field && {
          field: servicesObjectMap[field].field,
        }),
      },
    });
  }

  return <ObjectTypeDefinition>{
    name: currentService.typename,
    description: "Link type",
    fields: {
      ...generateIdField(),
      ...generateTypenameField(currentService),
      ...typeDefFields,
      ...generateCreatedAtField(),
      ...generateUpdatedAtField(),
      ...generateCreatedByField(User),
      ...additionalFields,
    },
  };
}
