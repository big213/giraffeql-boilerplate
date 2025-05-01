import { User, File } from "../../services";
import { GiraffeqlObjectType } from "giraffeql";
import {
  generateIdField,
  generateCreatedByField,
  generateStringField,
  generateTypenameField,
  generateIntegerField,
  processTypeDef,
  generateTimestampFields,
} from "../../core/helpers/typeDef";
import { storage } from "firebase-admin";
import { getDownloadURL } from "firebase-admin/storage";
import { serveImageSourcePath } from "../../../config";
import { generateServingUrl } from "../../helpers/file";
import { Scalars } from "../../scalars";

export default new GiraffeqlObjectType(
  processTypeDef({
    name: File.typename,
    description: "File",
    fields: {
      ...generateIdField(File),
      ...generateTypenameField(File),
      name: generateStringField({ allowNull: false }),
      size: generateIntegerField({
        allowNull: false,
        addable: false,
        updateable: false,
        bigInt: true,
      }),
      location: generateStringField({
        allowNull: false,
        updateable: false,
      }),
      contentType: generateStringField({
        allowNull: false,
        addable: false,
        updateable: false,
      }),
      servingUrl: {
        type: Scalars.url,
        allowNull: false,
        requiredSqlFields: ["location"],
        resolver: ({ parentValue }) => generateServingUrl(parentValue.location),
      },
      downloadUrl: {
        type: Scalars.url,
        allowNull: false,
        requiredSqlFields: ["location"],
        resolver: async ({ parentValue }) => {
          const bucket = storage().bucket();

          const file = bucket.file(
            `${serveImageSourcePath.value()}/${parentValue.location}`
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
          const bucket = storage().bucket();
          const file = bucket.file(
            `${serveImageSourcePath.value()}/${parentValue.location}`
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
        updateable: false,
      }),
      ...generateTimestampFields(),
      ...generateCreatedByField(User),
    },
  })
);
