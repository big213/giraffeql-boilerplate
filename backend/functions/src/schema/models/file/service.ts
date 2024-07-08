import { PaginatedService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import { storage } from "firebase-admin";
import {
  createObjectType,
  deleteObjectType,
} from "../../core/helpers/resolver";
import {
  allowIfRecordFieldIsCurrentUserFn,
  allowIfFilteringByCurrentUserFn,
  allowIfLoggedInFn,
} from "../../helpers/permissions";
import { serveImageSourcePath, serveImageTempPath } from "../../../config";

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
    getPaginator: allowIfFilteringByCurrentUserFn("createdBy.id"),

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
    const bucket = storage().bucket();
    const file = bucket.file(`${serveImageTempPath.value()}/${args.location}`);
    const [metadata] = await file.getMetadata();

    await file.move(`${serveImageSourcePath.value()}/${args.location}`);

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

    return this.getRecord({
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
    const bucket = storage().bucket();
    const file = bucket.file(
      `${serveImageSourcePath.value()}/${item.location}`
    );

    await file.delete();

    let requestedResults;

    if (Object.keys(query).length > 0) {
      // check for get permissions, if fields were requested
      await this.testPermissions("get", {
        req,
        args,
        query,
        fieldPath,
        isAdmin,
        data,
      });
      // fetch the requested query, if any
      requestedResults = await this.getRecord({
        req,
        args,
        query,
        fieldPath,
        isAdmin,
        data,
      });
    }

    await deleteObjectType({
      typename: this.typename,
      id: item.id,
      req,
      fieldPath,
    });

    return requestedResults ?? {};
  }
}
