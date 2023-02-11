import { LinkService, PaginatedService } from "../services";
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
    allowNullOutput?: boolean;
    sqlField?: string; // sql alias for the field, e.g. if it has CAPS
    updateable?: boolean; // can this field be updated?
  };
};

export function generateLinkTypeDef(
  servicesObjectMap: ServicesObjectMap,
  currentService: LinkService,
  additionalFields?: { [x: string]: ObjectTypeDefinitionField }
): ObjectTypeDefinition {
  // set the servicesObjectMap on currentService
  currentService.servicesObjectMap = servicesObjectMap;

  // only 2 services supported at the moment. additional fields may not work properly in sql.ts processJoinFields
  if (Object.keys(servicesObjectMap).length > 2) {
    throw new Error(
      `Maximum 2 services supported for link types at the moment`
    );
  }

  const typeDefFields = {};

  for (const field in servicesObjectMap) {
    typeDefFields[field] = generateJoinableField({
      service: servicesObjectMap[field].service,
      allowNull: servicesObjectMap[field].allowNull ?? false,
      allowNullOutput: servicesObjectMap[field].allowNullOutput,
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
