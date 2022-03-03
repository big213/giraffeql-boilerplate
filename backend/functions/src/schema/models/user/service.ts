import { PaginatedService } from "../../core/services";
import * as admin from "firebase-admin";
import {
  AccessControlMap,
  ExternalQuery,
  ServiceFunctionInputs,
} from "../../../types";

import { permissionsCheck } from "../../core/helpers/permissions";
import { userRoleKenum } from "../../enums";
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
import { generateError } from "../../core/helpers/error";
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
    get: async ({ req, args, query, fieldPath }) => {
      const record = await this.getFirstSqlRecord(
        {
          select: ["createdBy.id", "isPublic"],
          where: args,
        },
        fieldPath
      );

      if (isCurrentUser(req, record["createdBy.id"])) return true;

      if (
        isObject(query) &&
        objectOnlyHasFields(query, [
          "id",
          "__typename",
          "name",
          "avatar",
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
    getMultiple: async ({ req, args, query, fieldPath }) => {
      if (
        (isObject(query) &&
          objectOnlyHasFields(query, [
            "id",
            "__typename",
            "name",
            "avatar",
            "isPublic",
            "currentUserFollowLink",
          ])) ||
        !query
      ) {
        return true;
      }

      if (
        filterPassesTest(args.filterBy, (filterObject) => {
          return filterObject["isPublic"]?.eq === true;
        })
      ) {
        return true;
      }

      return false;
    },

    /*
    Allow if:
    - user is currentUser AND update fields ONLY avatar, name, isPublic
    */
    update: async ({ req, args }) => {
      if (
        isUserLoggedIn(req) &&
        isCurrentUser(req, req.user!.id) &&
        objectOnlyHasFields(args.fields, ["avatar", "name", "isPublic"])
      ) {
        return true;
      }

      return false;
    },
    "*": () => false,
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
    // args should be validated already
    const validatedArgs = <any>args;

    await this.handleLookupArgs(args, fieldPath);

    // create firebase user
    const firebaseUser = await admin.auth().createUser({
      email: validatedArgs.email,
      emailVerified: false,
      password: validatedArgs.password,
      displayName: validatedArgs.name,
      disabled: false,
      photoURL: validatedArgs.avatar,
    });

    const addResults = await createObjectType({
      typename: this.typename,
      addFields: {
        id: await this.generateRecordId(fieldPath),
        ...validatedArgs,
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
    // args should be validated already
    const validatedArgs = <any>args;
    //check if record exists
    const item = await this.getFirstSqlRecord({
      select: ["id", "role", "firebaseUid"],
      where: {
        id: data!.id,
      },
    });

    // make sure email field, if provided, matches the firebase user email
    if ("email" in validatedArgs) {
      const userRecord = await admin.auth().getUser(item.firebaseUid);
      validatedArgs.email = userRecord.email;
    }

    await updateObjectType({
      typename: this.typename,
      id: <number>validatedArgs.id,
      updateFields: {
        ...validatedArgs,
        updatedAt: 1,
      },
      req,
      fieldPath,
    });

    return this.getRecord({
      req,
      args: { id: validatedArgs.id },
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
    // args should be validated already
    const validatedArgs = <any>args;
    // check if record exists, get ID
    const item = await this.getFirstSqlRecord({
      select: ["id", "role", "firebaseUid"],
      where: validatedArgs.item,
    });

    // convert any lookup/joined fields into IDs
    await this.handleLookupArgs(validatedArgs.fields, fieldPath);

    //check if target user is more senior admin
    if (userRoleKenum[item.role] === "ADMIN" && item.id < req.user!.id) {
      throw generateError(
        "Cannot update more senior admin user",
        fieldPath,
        401
      );
    }

    await updateObjectType({
      typename: this.typename,
      id: item.id,
      updateFields: {
        ...validatedArgs.fields,
        updatedAt: 1,
      },
      req,
      fieldPath,
    });

    // update firebase user fields
    const firebaseUserFields = {
      ...("name" in validatedArgs.fields && {
        displayName: validatedArgs.fields.name,
      }),
      ...("avatar" in validatedArgs.fields && {
        photoURL: validatedArgs.fields.avatar,
      }),
      ...("email" in validatedArgs.fields && {
        email: validatedArgs.fields.email,
      }),
      ...("password" in validatedArgs.fields && {
        password: validatedArgs.fields.password,
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
    // args should be validated already
    const validatedArgs = <any>args;

    // confirm existence of item and get ID
    const item = await this.getFirstSqlRecord({
      select: ["id", "firebaseUid"],
      where: validatedArgs,
    });

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
