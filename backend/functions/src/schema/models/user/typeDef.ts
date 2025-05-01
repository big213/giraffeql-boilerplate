import { GiraffeqlObjectType } from "giraffeql";
import { User, UserRole, UserUserFollowLink } from "../../services";
import {
  generateIdField,
  generateCreatedByField,
  generateStringField,
  generateEnumField,
  generateArrayField,
  generateGenericScalarField,
  generateTypenameField,
  generateBooleanField,
  generateCurrentUserFollowLinkField,
  processTypeDef,
  generateTimestampFields,
  generateTextField,
} from "../../core/helpers/typeDef";
import { userRole } from "../../enums";
import { getUserPermissions } from "../../helpers/permissions";
import { Scalars } from "../../scalars";

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
        defaultValue: userRole.NORMAL,
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
        resolver: ({ parentValue }) =>
          getUserPermissions({
            role: parentValue.role,
            permissions: parentValue.permissions,
          }).map((permission) => permission.name),
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
