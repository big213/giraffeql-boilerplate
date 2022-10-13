import { PaginatedService } from "../services";
import { User } from "../../services";
import {
  generateIdField,
  generateCreatedByField,
  generateJoinableField,
  generateTypenameField,
  processTypeDef,
  generateTimestampFields,
} from "../helpers/typeDef";
import { ObjectTypeDefinition, ObjectTypeDefinitionField } from "giraffeql";

export type ServicesObjectMap = {
  [x: string]: {
    service: PaginatedService;
    allowNull?: boolean;
    sqlField?: string; // sql alias for the field, e.g. if it has CAPS
    updateable?: boolean; // can this field be updated?
  };
};

export function generateLinkTypeDef(
  servicesObjectMap: ServicesObjectMap,
  currentService: PaginatedService,
  additionalFields?: { [x: string]: ObjectTypeDefinitionField }
): ObjectTypeDefinition {
  const typeDefFields = {};

  for (const field in servicesObjectMap) {
    typeDefFields[field] = generateJoinableField({
      service: servicesObjectMap[field].service,
      allowNull: servicesObjectMap[field].allowNull ?? false,
      typeDefOptions: {
        addable: true,
        updateable: servicesObjectMap[field].updateable ?? true,
      },
      sqlOptions: {
        unique: "compositeIndex",
        ...(servicesObjectMap[field].sqlField && {
          field: servicesObjectMap[field].sqlField,
        }),
      },
    });
  }

  return <ObjectTypeDefinition>processTypeDef({
    name: currentService.typename,
    description: "Link type",
    fields: {
      ...generateIdField(currentService),
      ...generateTypenameField(currentService),
      ...typeDefFields,
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
      ...additionalFields,
    },
  });
}
