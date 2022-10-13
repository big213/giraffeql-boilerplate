import { User, ApiKey } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedByField,
  generateStringField,
  generateTypenameField,
  generateJoinableField,
  generateArrayField,
  processTypeDef,
  generateTimestampFields,
} from "../../core/helpers/typeDef";
import * as Scalars from "../../scalars";

export default new GiraffeqlObjectType(
  <ObjectTypeDefinition>processTypeDef({
    name: ApiKey.typename,
    description: "Api key",
    fields: {
      ...generateIdField(ApiKey),
      ...generateTypenameField(ApiKey),
      name: generateStringField({ allowNull: false }),
      code: generateStringField({
        allowNull: false,
        sqlOptions: { unique: true },
        typeDefOptions: { addable: false, updateable: false }, // auto-generated
      }),
      user: generateJoinableField({
        service: User,
        allowNull: false,
      }),
      permissions: generateArrayField({
        allowNull: true,
        type: Scalars.userPermission,
        nestHidden: true,
      }),
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
    },
  })
);
