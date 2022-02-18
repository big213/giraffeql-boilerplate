import { ObjectTypeDefinition, GiraffeqlObjectType } from "giraffeql";
import { User } from "../../services";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateStringField,
  generateEnumField,
  generateArrayField,
  generateGenericScalarField,
  generateTypenameField,
  generateBooleanField,
} from "../../core/helpers/typeDef";
import * as Scalars from "../../scalars";
import { userRoleKenum } from "../../enums";
import { userRoleToPermissionsMap } from "../../helpers/permissions";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: User.typename,
  description: "User type",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(User),
    name: generateStringField({ allowNull: false }),
    firebaseUid: generateStringField({
      allowNull: false,
      sqlOptions: {
        unique: true,
        field: "firebase_uid",
      },
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
    avatar: generateStringField({
      allowNull: true,
    }),
    role: generateEnumField({
      scalarDefinition: Scalars.userRole,
      allowNull: false,
      defaultValue: "NORMAL",
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

        if (role)
          allPermissions.push(
            ...userRoleToPermissionsMap[
              userRoleKenum.fromUnknown(role).name
            ].map((ele) => ele.name)
          );

        if (permissions) allPermissions.push(...permissions);

        return allPermissions;
      },
    },
    isPublic: generateBooleanField({
      allowNull: false,
      defaultValue: true,
      sqlOptions: { field: "is_public" },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
