import { storage } from "firebase-admin";
import { serveImageSourcePath, serveImageTempPath } from "../../../config";
import { PaginatedService } from "../../core/services";

export class FileService extends PaginatedService {
  defaultTypename = "file";

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
    parentKey: {},
  };

  uniqueKeyMap = {
    primary: ["id"],
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  groupByFieldsMap = {};

  async validateFileField(args: any, fieldname: string, regex: RegExp) {
    const field = args[fieldname];

    const filesToCheck = Array.isArray(field) ? field : field ? [field] : null;

    if (filesToCheck && filesToCheck.length > 0) {
      const images = await this.getAllSqlRecord({
        select: ["contentType"],
        where: [
          {
            field: "id",
            operator: "in",
            value: filesToCheck.map((ele) => ele.id),
          },
        ],
      });

      // if the image lengths do not line up, must be an invalid file in there. throw err
      if (images.length !== filesToCheck.length) {
        throw new Error(`Invalid file provided`);
      }

      // verify that all content types match image/*
      if (!images.every((ele) => ele.contentType.match(regex))) {
        throw new Error(`Invalid file provided for the '${fieldname}' field`);
      }
    }
  }

  async updateFileParentKeys(
    userId: string,
    typename: string,
    itemId: string,
    inputsArray: unknown[],
    fieldPath: string[]
  ) {
    const fileIdsArray: Set<number> = new Set();

    inputsArray.forEach((input) => {
      if (Array.isArray(input)) input.forEach((id) => fileIdsArray.add(id));
    });

    // must associate them with the parent item
    if (fileIdsArray.size) {
      // ensure all the files belong to the currentUser
      await this.updateSqlRecord({
        fields: {
          parentKey: `${typename}_${itemId}`,
        },
        where: [
          {
            field: "createdBy",
            value: userId,
          },
          {
            field: "id",
            operator: "in",
            value: [...fileIdsArray],
          },
        ],
      });
    }
  }
}
