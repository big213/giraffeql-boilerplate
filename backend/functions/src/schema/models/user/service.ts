import { PaginatedService } from "../../core/services";
import * as admin from "firebase-admin";
import {
  AccessControlMap,
  ExternalQuery,
  ServiceFunctionInputs,
} from "../../../types";
import { permissionsCheck } from "../../core/helpers/permissions";
import { isObject } from "giraffeql/lib/helpers/base";
import {
  filterPassesTest,
  isCurrentUser,
  isUserLoggedIn,
} from "../../helpers/permissions";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import {
  createObjectType,
  deleteObjectType,
  updateObjectType,
} from "../../core/helpers/resolver";
import { lookupSymbol } from "giraffeql";

export class UserService extends PaginatedService {
  defaultTypename = "user";

  defaultQuery: ExternalQuery = {
    id: lookupSymbol,
    name: lookupSymbol,
    avatar: lookupSymbol,
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
  };

  accessControl: AccessControlMap = {
    /*
    Allow if:
    - item was created by currentUser
    - item isPublic === true AND requested fields has fields id, name, avatar, email, isPublic, currentUserFollowLink ONLY
    - OR, if requested fields are id, name, avatar, isPublic, currentUserFollowLink  ONLY
    */
    get: async ({ req, args, query }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["createdBy.id", "isPublic"],
          where: args,
        },
        true
      );

      if (isCurrentUser(req, record["createdBy.id"])) return true;

      if (
        isObject(query) &&
        objectOnlyHasFields(query, [
          "id",
          "__typename",
          "name",
          "avatar",
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
        isObject(query) &&
        objectOnlyHasFields(query, [
          "id",
          "__typename",
          "name",
          "avatar",
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
    - filtering by isPublic === true
    - if requested fields are id, name, avatar, isPublic, currentUserFollowLink ONLY, or NO query
    */
    getMultiple: async ({ args, query }) => {
      if (
        (isObject(query) &&
          objectOnlyHasFields(query, [
            "id",
            "__typename",
            "name",
            "avatar",
            "description",
            "isPublic",
            "currentUserFollowLink",
          ])) ||
        !query
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
    - item.id is currentUser AND update fields ONLY avatar, name, isPublic
    */
    update: async ({ req, args }) => {
      if (
        isUserLoggedIn(req) &&
        isCurrentUser(req, args.item.id) &&
        objectOnlyHasFields(args.fields, [
          "avatar",
          "name",
          "description",
          "isPublic",
        ])
      ) {
        return true;
      }

      return false;
    },
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
    const firebaseUser = await admin.auth().createUser({
      email: args.email,
      emailVerified: false,
      password: args.password,
      displayName: args.name,
      disabled: false,
      photoURL: args.avatar,
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

  // syncs the user record with the firebase auth record
  async syncRecord({
    req,
    fieldPath,
    args,
    query,
    data,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    //check if record exists
    const item = await this.getFirstSqlRecord(
      {
        select: ["id", "role", "firebaseUid"],
        where: {
          id: data!.id,
        },
      },
      true
    );

    // make sure email field, if provided, matches the firebase user email
    if ("email" in args) {
      const userRecord = await admin.auth().getUser(item.firebaseUid);
      args.email = userRecord.email;
    }

    await updateObjectType({
      typename: this.typename,
      id: <number>args.id,
      updateFields: {
        ...args,
        updatedAt: 1,
      },
      req,
      fieldPath,
    });

    return this.getRecord({
      req,
      args: { id: args.id },
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
      ...("avatar" in args.fields && {
        photoURL: args.fields.avatar,
      }),
      ...("email" in args.fields && {
        email: args.fields.email,
      }),
      ...("password" in args.fields && {
        password: args.fields.password,
      }),
    };

    if (Object.keys(firebaseUserFields).length > 0) {
      await admin.auth().updateUser(item.firebaseUid, firebaseUserFields);
    }

    return this.isEmptyQuery(query)
      ? {}
      : await this.getRecord({
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

    // remove firebase auth user
    await admin.auth().deleteUser(item.firebaseUid);

    return requestedResults;
  }
}
