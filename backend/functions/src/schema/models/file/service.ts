import { PaginatedService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import * as admin from "firebase-admin";
import {
  createObjectType,
  deleteObjectType,
} from "../../core/helpers/resolver";
import {
  allowIfRecordFieldIsCurrentUserFn,
  allowIfFilteringByCurrentUserFn,
  allowIfLoggedInFn,
} from "../../helpers/permissions";
import { env } from "../../../config";

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

  accessControl: AccessControlMap = {
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
    getMultiple: allowIfFilteringByCurrentUserFn("createdBy.id"),

    /*
    Allow if:
    - user created the item
    */
    update: allowIfRecordFieldIsCurrentUserFn(this, "createdBy.id"),

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
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    await this.handleLookupArgs(args);

    // verify location exists and move it into /source folder
    const bucket = admin.storage().bucket();
    const file = bucket.file(`${env.serve_image.temp_path}/${args.location}`);
    const [metadata] = await file.getMetadata();

    await file.move(`${env.serve_image.source_path}/${args.location}`);

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(),
        ...args,
        size: metadata.size,
        contentType: metadata.contentType,
        createdBy: req.user!.id,
      },
      req,
      fieldPath,
    });

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args: { id: addResults.id },
          query,
          fieldPath,
          isAdmin,
          data,
        });
  }

  @permissionsCheck("delete")
  async deleteRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // confirm existence of item and get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "location"],
        where: args,
      },
      true
    );

    // verify location exists and delete it
    const bucket = admin.storage().bucket();
    const file = bucket.file(`${env.serve_image.source_path}/${item.location}`);

    await file.delete();

    // first, fetch the requested query, if any
    const requestedResults = this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
          req,
          args,
          query,
          fieldPath,
          isAdmin,
          data,
        });

    await deleteObjectType({
      typename: this.typename,
      id: item.id,
      req,
      fieldPath,
    });

    return requestedResults;
  }
}
