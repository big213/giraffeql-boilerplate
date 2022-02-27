import { PaginatedService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs, AccessControlMap } from "../../../types";
import { nanoid } from "nanoid";
import { createObjectType } from "../../core/helpers/resolver";
import {
  filterPassesTest,
  isCurrentUser,
  isUserLoggedIn,
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
  };

  searchFieldsMap = {
    name: {},
  };

  groupByFieldsMap = {};

  accessControl: AccessControlMap = {
    /*
    Allow if:
    - user.id is currentUser
    */
    get: async ({ req, args, fieldPath }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        fieldPath
      );
      if (isCurrentUser(req, record["user.id"])) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - filtering by user.id is currentUser
    */
    getMultiple: ({ req, args }) => {
      if (
        filterPassesTest(args.filterBy, (filterObject) => {
          return isCurrentUser(req, filterObject["user.id"]?.eq);
        })
      ) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - user.id is currentUser
    */
    update: async ({ req, args, fieldPath }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        fieldPath
      );
      if (isCurrentUser(req, record["user.id"])) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - user.id is currentUser
    */
    delete: async ({ req, args, fieldPath }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["user.id"],
          where: args,
        },
        fieldPath
      );
      if (isCurrentUser(req, record["user.id"])) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - args.user is currentUser
    */
    create: async ({ req, args, fieldPath }) => {
      // handle lookupArgs, convert lookups into ids
      await this.handleLookupArgs(args, fieldPath);

      if (isCurrentUser(req, args.user)) return true;

      return false;
    },
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

    await this.handleLookupArgs(args, fieldPath);

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
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
