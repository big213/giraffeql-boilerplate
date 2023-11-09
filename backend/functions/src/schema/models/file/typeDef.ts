import { User, File } from "../../services";
import { GiraffeqlObjectType, ObjectTypeDefinition } from "giraffeql";
import {
  generateIdField,
  generateCreatedByField,
  generateStringField,
  generateTypenameField,
  generateIntegerField,
  processTypeDef,
  generateTimestampFields,
} from "../../core/helpers/typeDef";
import * as Scalars from "../../scalars";
import * as admin from "firebase-admin";
import { env } from "../../../config";
import { getDownloadURL } from "firebase-admin/storage";

export default new GiraffeqlObjectType(
  <ObjectTypeDefinition>processTypeDef({
    name: File.typename,
    description: "File",
    fields: {
      ...generateIdField(File),
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
      }),
      servingUrl: {
        type: Scalars.url,
        allowNull: false,
        requiredSqlFields: ["location"],
        resolver: ({ parentValue }) => {
          return `${env.serve_image.cdn_url}/${parentValue.location}`;
        },
      },
      downloadUrl: {
        type: Scalars.url,
        allowNull: false,
        requiredSqlFields: ["location"],
        resolver: async ({ parentValue }) => {
          const bucket = admin.storage().bucket();

          const file = bucket.file(
            `${env.serve_image.source_path}/${parentValue.location}`
          );

          const downloadUrl = await getDownloadURL(file);

          return downloadUrl;
        },
      },
      signedUrl: {
        type: Scalars.url,
        allowNull: false,
        requiredSqlFields: ["location"],
        resolver({ parentValue }) {
          const bucket = admin.storage().bucket();
          const file = bucket.file(
            `${env.serve_image.source_path}/${parentValue.location}`
          );

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
      }),
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
    },
  })
);
