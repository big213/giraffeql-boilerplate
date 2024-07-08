import { PaginatedService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import { nanoid } from "nanoid";
import { createObjectType } from "../../core/helpers/resolver";
import {
  allowIfArgsFieldIsCurrentUserFn,
  allowIfRecordFieldIsCurrentUserFn,
  allowIfFilteringByCurrentUserFn,
} from "../../helpers/permissions";

export class ApiKeyService extends PaginatedService {
  defaultTypename = "apiKey";

  filterFieldsMap = {
    id: {},
    "user.id": {},
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
    - args.user is currentUser
    */
    create: allowIfArgsFieldIsCurrentUserFn(this, "user"),

    /*
    Allow if:
    - user.id is currentUser
    */
    get: allowIfRecordFieldIsCurrentUserFn(this, "user.id"),

    /*
    Allow if:
    - filtering by user.id is currentUser
    */
    getPaginator: allowIfFilteringByCurrentUserFn("user.id"),

    /*
    Allow if:
    - user.id is currentUser
    */
    update: allowIfRecordFieldIsCurrentUserFn(this, "user.id"),

    /*
    Allow if:
    - user.id is currentUser
    */
    delete: allowIfRecordFieldIsCurrentUserFn(this, "user.id"),
  };

  @permissionsCheck("create")
  async createRecord({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // args should be validated already
    const validatedArgs = <any>args;

    await this.handleLookupArgs(args);

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(),
        ...validatedArgs,
        code: nanoid(),
        createdBy: req.user!.id,
      },
      req,
      fieldPath,
    });

    return this.getRecord({
      req,
      fieldPath,
      args: { id: addResults.id },
      query,
      isAdmin,
    });
  }
}
