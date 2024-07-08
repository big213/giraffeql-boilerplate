import { PaginatedService } from "../../core/services";
import { auth } from "firebase-admin";
import {
  AccessControlMap,
  ExternalQuery,
  ServiceFunctionInputs,
} from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import {
  filterPassesTest,
  isCurrentUser,
  isUserLoggedIn,
  queryOnlyHasFields,
} from "../../helpers/permissions";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import {
  createObjectType,
  deleteObjectType,
  updateObjectType,
} from "../../core/helpers/resolver";
import { lookupSymbol } from "giraffeql";
import { knex } from "../../../utils/knex";

export class UserService extends PaginatedService {
  defaultTypename = "user";

  defaultQuery: ExternalQuery = {
    id: lookupSymbol,
    name: lookupSymbol,
    avatarUrl: lookupSymbol,
  };

  filterFieldsMap = {
    id: {},
    "createdBy.name": {},
    isPublic: {},
    role: {},
  };

  uniqueKeyMap = {
    primary: ["id"],
    email: ["email"],
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
    email: {},
  };

  accessControl: AccessControlMap = {
    // create: only admins

    /*
    Allow if:
    - item.id is currentUser
    - item isPublic === true AND requested fields has fields id, name, avatarUrl, email, isPublic, currentUserFollowLink ONLY
    - OR, if requested fields are id, name, avatarUrl, isPublic, currentUserFollowLink  ONLY
    */
    get: async ({ req, args, query }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["id", "isPublic"],
          where: args,
        },
        true
      );

      if (isCurrentUser(req, record.id)) return true;

      if (
        queryOnlyHasFields(query, [
          "id",
          "__typename",
          "name",
          "avatarUrl",
          "description",
          "email",
          "isPublic",
          "currentUserFollowLink",
        ]) &&
        record.isPublic
      ) {
        return true;
      }

      if (
        queryOnlyHasFields(query, [
          "id",
          "__typename",
          "name",
          "avatarUrl",
          "description",
          "isPublic",
          "currentUserFollowLink",
        ])
      ) {
        return true;
      }

      return false;
    },

    // not allowed (except by admins)
    /*
    Allow if:
    - filtering by isPublic === true
    - if requested fields are id, name, avatarUrl, isPublic, currentUserFollowLink ONLY, or NO query
    */
    getPaginator: async ({ args, query }) => {
      if (
        !query ||
        queryOnlyHasFields(query, [
          "id",
          "__typename",
          "name",
          "avatarUrl",
          "description",
          "isPublic",
          "currentUserFollowLink",
        ])
      ) {
        return true;
      }

      if (
        await filterPassesTest(args.filterBy, (filterObject) => {
          return filterObject["isPublic"]?.eq === true;
        })
      ) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - item.id is currentUser AND update fields ONLY avatarUrl, name, isPublic
    */
    update: async ({ req, args }) => {
      if (
        isUserLoggedIn(req) &&
        isCurrentUser(req, args.item.id) &&
        objectOnlyHasFields(args.fields, [
          "avatarUrl",
          "name",
          "description",
          "isPublic",
          "allowEmailNotifications",
        ])
      ) {
        return true;
      }

      return false;
    },

    // delete: only admin allowed to delete
  };

  async getSpecialParams({ req }: ServiceFunctionInputs) {
    return {
      currentUserId: req.user?.id ?? null,
    };
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

    // create firebase user
    const firebaseUser = await auth().createUser({
      email: args.email,
      emailVerified: false,
      password: args.password,
      displayName: args.name,
      disabled: false,
      photoURL: args.avatarUrl,
    });

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(),
        ...args,
        firebaseUid: firebaseUser.uid,
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

  // syncs the user's email with their firebase email, in case they fall out of sync (due to updating email, etc)
  async syncRecord({
    req,
    fieldPath,
    args,
    query,
    data,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // login required
    if (!req.user) throw new Error(`Login required`);

    // check if record exists
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "email", "role", "firebaseUid"],
        where: {
          id: req.user.id,
        },
      },
      true
    );

    const userRecord = await auth().getUser(item.firebaseUid);

    // if email is different, sync it
    if (item.email !== userRecord.email) {
      await this.updateSqlRecord({
        fields: {
          email: userRecord.email,
          updatedAt: "knex.fn.now()",
        },
        where: {
          id: req.user.id,
        },
      });
    }

    return this.getRecord({
      req,
      args: { id: req.user.id },
      query,
      fieldPath,
    });
  }

  @permissionsCheck("update")
  async updateRecord({
    req,
    fieldPath,
    args,
    query,
    data = {},
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // check if record exists, get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "role", "firebaseUid"],
        where: args.item,
      },
      true
    );

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(args.fields);

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...args.fields,
        updatedAt: 1,
      },
      req,
      fieldPath,
    });

    // update firebase user fields
    const firebaseUserFields = {
      ...("name" in args.fields && {
        displayName: args.fields.name,
      }),
      ...("avatarUrl" in args.fields && {
        photoURL: args.fields.avatarUrl,
      }),
      ...("email" in args.fields && {
        email: args.fields.email,
      }),
      ...("password" in args.fields && {
        password: args.fields.password,
      }),
    };

    if (Object.keys(firebaseUserFields).length > 0) {
      await auth().updateUser(item.firebaseUid, firebaseUserFields);
    }

    return this.getRecord({
      req,
      args: { id: item.id },
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
    data,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    // confirm existence of item and get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "firebaseUid"],
        where: args,
      },
      true
    );

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

    // delete the type and also any associated services
    await knex.transaction(async (transaction) => {
      await deleteObjectType({
        typename: this.typename,
        id: item.id,
        req,
        fieldPath,
        transaction,
      });

      for (const deleteEntry of this.getOnDeleteEntries()) {
        await deleteEntry.service.deleteSqlRecord({
          where: {
            [deleteEntry.field ?? this.typename]: item.id,
          },
          transaction,
        });
      }
    });

    // remove firebase auth user
    await auth().deleteUser(item.firebaseUid);

    return requestedResults ?? {};
  }
}
