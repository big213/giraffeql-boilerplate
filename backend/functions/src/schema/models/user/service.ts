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
} from "../../helpers/permissions";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import { knex } from "../../../utils/knex";
import { getObjectType } from "../../core/helpers/resolver";
import { ItemNotFoundError } from "../../core/helpers/error";

export class UserService extends PaginatedService {
  defaultTypename = "user";

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

    // always allowed to get current user
    getCurrentUser: () => true,

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
          where: { id: req.user!.id },
        },
        true
      );

      if (isCurrentUser(req, record.id)) return true;

      if (
        query &&
        objectOnlyHasFields(query, [
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
        objectOnlyHasFields(query, [
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
        (await filterPassesTest(args.filterBy, (filterObject) => {
          return filterObject["isPublic"]?.eq === true;
        })) &&
        query.edges?.node &&
        objectOnlyHasFields(query.edges.node, [
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
          "notificationMethods",
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

  @permissionsCheck("getCurrentUser")
  async getCurrentUser({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    if (!req.user) {
      throw new Error(`Login is required`);
    }

    const results = await getObjectType({
      typename: this.typename,
      req,
      rootResolver,
      fieldPath,
      externalQuery: query,
      sqlParams: {
        where: {
          id: req.user!.id,
        },
        limit: 1,
        specialParams: await this.getSpecialParams({
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        }),
      },
    });

    if (results.length < 1) {
      throw new ItemNotFoundError({ fieldPath });
    }

    return results[0];
  }

  @permissionsCheck("create")
  async createRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    // create firebase user
    const firebaseUser = await auth().createUser({
      email: args.email,
      emailVerified: false,
      password: args.password,
      displayName: args.name,
      disabled: false,
      photoURL: args.avatarUrl,
    });

    let addResults;
    await knex.transaction(async (transaction) => {
      addResults = await this.createSqlRecord({
        fields: {
          ...args,
          firebaseUid: firebaseUser.uid,
          createdBy: req.user!.id,
        },
        transaction,
      });

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

  // syncs the user's email with their firebase email, in case they fall out of sync (due to updating email, etc)
  async syncRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
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
      await this.updateSqlRecord(
        {
          fields: {
            email: userRecord.email,
          },
          where: {
            id: req.user.id,
          },
        },
        true
      );
    }

    return this.getReturnQuery({
      id: req.user.id,
      inputs: {
        req,
        rootResolver,
        args,
        query,
        fieldPath,
      },
    });
  }

  @permissionsCheck("update")
  async updateRecord({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    // check if record exists, get ID
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "role", "firebaseUid"],
        where: { id: args.item },
      },
      true
    );

    await knex.transaction(async (transaction) => {
      await this.updateSqlRecord(
        {
          fields: {
            ...args.fields,
          },
          where: {
            id: item.id,
          },
          transaction,
        },
        true
      );

      // do post-update fn, if any
      await this.afterUpdateProcess(
        {
          req,
          rootResolver,
          fieldPath,
          args,
          query,
        },
        item.id,
        transaction
      );
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

    return this.getReturnQuery({
      id: item.id,
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
        select: ["id", "firebaseUid"],
        where: { id: args },
      },
      true
    );

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

    // delete the type and also any associated services
    await knex.transaction(async (transaction) => {
      await this.deleteSqlRecord({
        where: {
          id: item.id,
        },
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

    return requestedQuery;
  }
}
