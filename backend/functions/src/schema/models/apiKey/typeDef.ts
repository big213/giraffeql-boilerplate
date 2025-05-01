import { User, ApiKey } from "../../services";
import { GiraffeqlObjectType } from "giraffeql";
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
import {
  getAllowedApiKeyPermissions,
  getUserPermissions,
  isPermissionAllowed,
  parsePermissions,
  userRoleToPermissionsMap,
} from "../../helpers/permissions";
import { userRole } from "../../enums";
import { Scalars } from "../../scalars";

export default new GiraffeqlObjectType(
  processTypeDef({
    name: ApiKey.typename,
    description: "Api key",
    fields: {
      ...generateIdField(ApiKey),
      ...generateTypenameField(ApiKey),
      name: generateStringField({ allowNull: false }),
      code: generateStringField({
        allowNull: false,
        sqlOptions: { unique: true },
        addable: false,
        updateable: false, // auto-generated
      }),
      user: generateJoinableField({
        service: User,
        allowNull: false,
      }),
      permissions: generateArrayField({
        allowNull: true,
        type: Scalars.userPermission,
      }),
      allowedPermissions: {
        type: Scalars.userPermission,
        arrayOptions: {
          allowNullElement: false,
        },
        requiredSqlFields: ["user.role", "user.permissions", "permissions"],
        allowNull: false,
        resolver: ({ parentValue }) => {
          // get the permissions of the user
          const userPermissions = getUserPermissions({
            role: parentValue.user.role,
            permissions: parentValue.user.permissions,
          });

          const apiKeyPermissions = parsePermissions(parentValue.permissions);

          const allowedPermissions = getAllowedApiKeyPermissions({
            userPermissions,
            apiKeyPermissions,
          });

          return allowedPermissions.map((permission) => permission.name);
        },
      },
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
    },
  })
);
