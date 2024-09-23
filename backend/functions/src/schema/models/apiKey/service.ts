import { PaginatedService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import { nanoid } from "nanoid";
import {
  allowIfArgsFieldIsCurrentUserFn,
  allowIfRecordFieldIsCurrentUserFn,
  allowIfFilteringByCurrentUserFn,
} from "../../helpers/permissions";
import { knex } from "../../../utils/knex";

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
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    await this.handleLookupArgs(args);

    let addResults;
    await knex.transaction(async (transaction) => {
      addResults = await this.createSqlRecord({
        fields: {
          ...args,
          code: nanoid(),
          createdBy: req.user!.id,
        },
        transaction,
      });

      // do post-create fn, if any
      await this.afterCreateProcess(
        {
          req,
          fieldPath,
          args,
          query,
          data,
          isAdmin,
        },
        addResults.id,
        transaction
      );
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
