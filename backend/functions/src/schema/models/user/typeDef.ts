import { ObjectTypeDefinition, GiraffeqlObjectType } from "giraffeql";
import { User, UserUserFollowLink } from "../../services";
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
import * as Scalars from "../../scalars";
import { userRole } from "../../enums";
import { userRoleToPermissionsMap } from "../../helpers/permissions";

export default new GiraffeqlObjectType(
  <ObjectTypeDefinition>processTypeDef({
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
        typeDefOptions: { addable: false, updateable: false },
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
        scalarDefinition: Scalars.userRole,
        allowNull: false,
        defaultValue: userRole.NORMAL,
        isKenum: true,
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
        resolver({ parentValue }) {
          const role = parentValue.role;
          const permissions = parentValue.permissions;

          const allPermissions: string[] = [];

          if (role) {
            const roleName = userRole.fromUnknown(role).name;
            if (roleName in userRoleToPermissionsMap) {
              allPermissions.push(
                ...userRoleToPermissionsMap[roleName].map((ele) => ele.name)
              );
            }
          }

          if (permissions) allPermissions.push(...permissions);

          return allPermissions;
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
