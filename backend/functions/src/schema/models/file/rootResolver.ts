import { File } from "../../services";
import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
  generateDeleteRootResolver,
} from "../../core/helpers/rootResolver";
import { ValidatorGenerators } from "../../core/helpers/validator";
import { storage } from "firebase-admin";
import { serveImageTempPath, serveImageSourcePath } from "../../../config";

export default {
  ...generateBaseRootResolvers({
    service: File,
    methods: [
      {
        type: "get",
        /*
        Allow if:
        - createdBy.id is currentUser
        */
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          File,
          "createdBy.id"
        ),
      },
      {
        type: "getPaginator",
        /*
        Allow if:
        - filtering by createdBy.id is currentUser,
        */
        validator:
          ValidatorGenerators.allowIfFilteringByCurrentUser("createdBy.id"),
      },
      {
        type: "create",
        /*
        Allow if:
        - is logged in
        */
        validator: ValidatorGenerators.allowIfLoggedIn(),
        resolver: generateCreateRootResolver({
          service: File,
          options: {
            async getCreateFields({ inputs: { processedArgs }, transaction }) {
              // verify location exists and move it into /source folder
              const bucket = storage().bucket();
              const file = bucket.file(
                `${serveImageTempPath.value()}/${processedArgs.location}`
              );
              const [metadata] = await file.getMetadata();

              await file.move(
                `${serveImageSourcePath.value()}/${processedArgs.location}`
              );

              return {
                ...processedArgs,
                size: metadata.size,
                contentType: metadata.contentType,
              };
            },
          },
        }),
      },
      {
        type: "update",
        /*
        Allow if:
        - user created the item
        */
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          File,
          "createdBy.id",
          "item"
        ),
      },
      {
        type: "delete",
        /*
        Allow if:
        - user created the item
        */
        validator: ValidatorGenerators.allowIfRecordFieldIsCurrentUser(
          File,
          "createdBy.id"
        ),
        resolver: generateDeleteRootResolver({
          service: File,
          options: {
            fields: ["location"],
            async afterDelete({ inputs, item, transaction }) {
              // verify location exists and delete it
              const bucket = storage().bucket();
              const file = bucket.file(
                `${serveImageSourcePath.value()}/${item.location}`
              );

              await file.delete();
            },
          },
        }),
      },
      { type: "stats", validator: ValidatorGenerators.allowIfAdmin() },
    ],
  }),
};
