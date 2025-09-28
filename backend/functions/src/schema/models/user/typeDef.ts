import { GiraffeqlObjectType } from "giraffeql";
import {
  getUserPermissions,
  isPermissionAllowed,
} from "../../core/helpers/permissions";
import {
  generateArrayField,
  generateBooleanField,
  generateCreatedByField,
  generateCurrentUserFollowLinkField,
  generateEnumField,
  generateGenericScalarField,
  generateIdField,
  generateStringField,
  generateTextField,
  generateTimestampFields,
  generateTypenameField,
  processTypeDef,
} from "../../core/helpers/typeDef";
import { userPermissionEnum, userRoleKenum } from "../../enums";
import { Scalars } from "../../scalars";
import { User, UserRole, UserUserFollowLink } from "../../services";

export default new GiraffeqlObjectType(
  processTypeDef({
    name: User.typename,
    description: "User type",
    fields: {
      ...generateIdField(User),
      ...generateTypenameField(User),
      name: generateStringField({ allowNull: false }),
      firebaseUid: generateStringField({
        allowNull: false,
        sqlOptions: {
          unique: true,
        },
        addable: false,
        updateable: false,
        hidden: true,
      }),
      email: generateStringField({
        allowNull: false,
        sqlOptions: {
          unique: true,
        },
        nestHidden: true,
      }),
      // not a sql field
      password: generateGenericScalarField({
        allowNull: false,
        hidden: true,
        type: Scalars.string,
        typeDefOptions: {
          addable: true,
          updateable: true,
        },
      }),
      avatarUrl: generateStringField({
        allowNull: true,
        type: Scalars.imageUrl,
      }),
      description: generateTextField({
        allowNull: true,
      }),
      role: generateEnumField({
        service: UserRole,
        allowNull: false,
        defaultValue: userRoleKenum.NORMAL,
        nestHidden: true,
      }),
      permissions: generateArrayField({
        allowNull: true,
        type: Scalars.userPermission,
        nestHidden: true,
      }),
      allPermissions: {
        type: Scalars.userPermission,
        arrayOptions: {
          allowNullElement: false,
        },
        nestHidden: true,
        requiredSqlFields: ["role", "permissions"],
        allowNull: false,
        resolver: ({ parentValue }) => {
          const userPermissionEnums = getUserPermissions({
            role: parentValue.role,
            permissions: parentValue.permissions,
          });

          return userPermissionEnum.values
            .filter((permission) =>
              isPermissionAllowed({
                userPermissionEnums,
                permission,
              })
            )
            .map((value) => value.name);
        },
      },
      isPublic: generateBooleanField({
        allowNull: false,
        defaultValue: true,
      }),
      allowEmailNotifications: generateBooleanField({
        allowNull: false,
        defaultValue: true,
      }),
      currentUserFollowLink:
        generateCurrentUserFollowLinkField(UserUserFollowLink),
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
    },
  })
);
