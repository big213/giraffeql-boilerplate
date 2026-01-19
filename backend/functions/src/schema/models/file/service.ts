import { Knex } from "knex";
import { PaginatedService } from "../../core/services";
import { storage } from "firebase-admin";
import { serveImageSourcePath } from "../../../config";
import { generateId } from "../../core/helpers/shared";
import { User } from "../../services";
import {
  generateServingUrl,
  getFirebaseStorageData,
  getFirebaseStorageMetadata,
  saveFirebaseFile,
} from "../../helpers/file";
import { nanoid } from "nanoid";

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
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

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

  async updateFileParentKeys({
    userId,
    service,
    itemId,
    fileIds,
    transaction,
  }: {
    userId: string;
    service: PaginatedService;
    itemId: string;
    fileIds: string[];
    transaction?: Knex.Transaction;
  }) {
    const uniqueFileIds = [...new Set(fileIds)];

    // must associate them with the parent item
    if (uniqueFileIds.length) {
      // ensure all the files belong to the currentUser
      await this.updateSqlRecord({
        fields: {
          parentKey: `${service.typename}_${itemId}`,
        },
        where: [
          {
            field: "createdBy",
            value: userId,
          },
          {
            field: "id",
            operator: "in",
            value: uniqueFileIds,
          },
        ],
        transaction,
      });
    }
  }

  async createFromData({
    filename,
    data,
    parentKey,
    userId,
    transaction,
  }: {
    filename: string;
    data: string;
    parentKey?: string | null;
    userId: string;
    transaction?: Knex.Transaction;
  }) {
    const user = await User.getFirstSqlRecord(
      {
        select: ["id", "firebaseUid"],
        where: {
          id: userId,
        },
        transaction,
      },
      true
    );

    const location = `${user.firebaseUid}/${nanoid()}/${filename}`;

    await saveFirebaseFile({
      data,
      location,
    });

    const fileObject = await getFirebaseStorageMetadata(location);

    // create the file
    const addResults = await this.createSqlRecord({
      fields: {
        name: filename,
        size: fileObject.size,
        location,
        contentType: fileObject.contentType,
        parentKey,
        createdBy: user.id,
      },
      transaction,
    });

    return {
      fileId: addResults.id,
      url: generateServingUrl(location),
    };
  }
}
