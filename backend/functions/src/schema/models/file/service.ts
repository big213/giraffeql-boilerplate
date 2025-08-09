import { PaginatedService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import { storage } from "firebase-admin";
import {
  allowIfRecordFieldIsCurrentUserFn,
  allowIfFilteringByCurrentUserFn,
  allowIfLoggedInFn,
} from "../../helpers/permissions";
import { serveImageSourcePath, serveImageTempPath } from "../../../config";
import { knex } from "../../../utils/knex";

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

  accessControlMap: AccessControlMap = {
    /*
    Allow if:
    - is logged in
    */
    create: allowIfLoggedInFn(),

    /*
    Allow if:
    - createdBy.id is currentUser
    */
    get: allowIfRecordFieldIsCurrentUserFn(this, "createdBy.id"),

    /*
    Allow if:
    - filtering by createdBy.id is currentUser,
    */
    getPaginator: allowIfFilteringByCurrentUserFn("createdBy.id"),

    /*
    Allow if:
    - user created the item
    */
    update: allowIfRecordFieldIsCurrentUserFn(this, "createdBy.id", "item"),

    /*
    Allow if:
    - user created the item
    */
    delete: allowIfRecordFieldIsCurrentUserFn(this, "createdBy.id"),
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

  @permissionsCheck("create")
  async createRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    // verify location exists and move it into /source folder
    const bucket = storage().bucket();
    const file = bucket.file(`${serveImageTempPath.value()}/${args.location}`);
    const [metadata] = await file.getMetadata();

    await file.move(`${serveImageSourcePath.value()}/${args.location}`);

    let addResults;
    await knex.transaction(async (transaction) => {
      addResults = await this.createSqlRecord({
        fields: {
          ...args,
          size: metadata.size,
          contentType: metadata.contentType,
          createdBy: req.user!.id,
        },
        extendFn: (knexObject) => {
          knexObject.onConflict().ignore();
        },
        transaction,
      });

      // if addResults falsey, there was a conflict
      if (!addResults) {
        throw new Error(
          `An entry with this combination of unique keys already exists`
        );
      }

      // do post-create fn, if any
      await this.afterCreateProcess(
        {
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        },
        addResults.id,
        transaction
      );
    });

    return this.getReturnQuery({
      id: addResults.id,
      inputs: {
        req,
        rootResolver,
        args,
        query,
        fieldPath,
      },
    });
  }

  @permissionsCheck("delete")
  async deleteRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    // confirm existence of item and get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "location"],
        where: { id: args },
      },
      true
    );

    // verify location exists and delete it
    const bucket = storage().bucket();
    const file = bucket.file(
      `${serveImageSourcePath.value()}/${item.location}`
    );

    await file.delete();

    const requestedQuery = await this.getReturnQuery({
      id: item.id,
      inputs: {
        req,
        rootResolver,
        args,
        query,
        fieldPath,
      },
    });

    await this.deleteSqlRecord({
      where: {
        id: item.id,
      },
    });

    return requestedQuery;
  }
}
