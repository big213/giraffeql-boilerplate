import { User, File } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedAtField,
  generateUpdatedAtField,
  generateCreatedByField,
  generateStringField,
  generateTypenameField,
  generateIntegerField,
} from "../../core/helpers/typeDef";
import * as Scalars from "../../scalars";
import * as admin from "firebase-admin";

export default new GiraffeqlObjectType(<ObjectTypeDefinition>{
  name: File.typename,
  description: "File",
  fields: {
    ...generateIdField(),
    ...generateTypenameField(File),
    name: generateStringField({ allowNull: false }),
    size: generateIntegerField({
      allowNull: false,
      typeDefOptions: { addable: false, updateable: false },
    }),
    location: generateStringField({
      allowNull: false,
      typeDefOptions: { addable: true, updateable: false },
    }),
    contentType: generateStringField({
      allowNull: false,
      typeDefOptions: { addable: false, updateable: false },
      sqlOptions: {
        field: "content_type",
      },
    }),
    signedUrl: {
      type: Scalars.string,
      allowNull: false,
      requiredSqlFields: ["location"],
      resolver({ parentValue }) {
        const bucket = admin.storage().bucket();
        const file = bucket.file("source/" + parentValue.location);

        return file
          .getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + 15 * 60 * 1000, // 15 mins
          })
          .then((res) => res[0]);
      },
    },
    parentKey: generateStringField({
      allowNull: true,
      typeDefOptions: { addable: true, updateable: false },
      sqlOptions: {
        field: "parent_key",
      },
    }),
    ...generateCreatedAtField(),
    ...generateUpdatedAtField(),
    ...generateCreatedByField(User),
  },
});
