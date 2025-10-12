import { auth } from "firebase-admin";
import { GiraffeqlRootResolverType, lookupSymbol } from "giraffeql";
import { ItemNotFoundError, PermissionsError } from "../../core/helpers/error";
import {
  isCurrentUser,
  validateQueryFields,
} from "../../core/helpers/permissions";
import { getObjectType } from "../../core/helpers/resolver";
import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
  generateDeleteRootResolver,
  generateGetPaginatorRootResolver,
  generateUpdateRootResolver,
  processRootResolverArgs,
} from "../../core/helpers/rootResolver";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import { Validators } from "../../helpers/validator";
import { User } from "../../services";

const allowedQueryFields = [
  "id",
  "__typename",
  "name",
  "avatarUrl",
  "description",
  "currentUserFollowLink",
];

export default {
  ...generateBaseRootResolvers({
    service: User,
    methods: [
      {
        type: "get",
        /*
        Allow if:
        - item.id is currentUser
        - item isPublic === true AND only certain fields requested
        */
        validator: Validators.allowIfRecordFieldsPassTest(
          User,
          ["id", "isPublic"],
          (record, { req, query }) => {
            return (
              isCurrentUser(req, record.id) ||
              (query &&
                validateQueryFields(query, allowedQueryFields, false) &&
                record.isPublic)
            );
          }
        ),
      },
      {
        type: "getPaginator",
        // not allowed (except by admins)
        /*
        Allow if:
        - filtering by isPublic === true
        - if requested fields are id, name, avatarUrl, currentUserFollowLink ONLY, or NO query
        */
        validator: [
          Validators.allowIfFiltersPassTest(
            (filterObject, inputs) => filterObject.isPublic?.eq === true
          ),
          Validators.allowIfOnlyTheseFieldsInQuery(allowedQueryFields, true),
        ],
        resolver: generateGetPaginatorRootResolver(User),
        restOptions: {
          query: {
            paginatorInfo: {
              count: lookupSymbol,
              total: lookupSymbol,
            },
            edges: {
              node: {
                id: lookupSymbol,
                __typename: lookupSymbol,
                name: lookupSymbol,
                avatarUrl: lookupSymbol,
              },
            },
          },
        },
      },
      {
        type: "create",
        validator: Validators.allowIfAdmin(),
        resolver: generateCreateRootResolver({
          service: User,
          options: {
            async getCreateFields({ inputs: { processedArgs }, transaction }) {
              // create firebase user
              const firebaseUser = await auth().createUser({
                email: processedArgs.email,
                emailVerified: false,
                password: processedArgs.password,
                displayName: processedArgs.name,
                disabled: false,
                photoURL: processedArgs.avatarUrl,
              });
              return {
                ...processedArgs,
                firebaseUid: firebaseUser.uid,
              };
            },
          },
        }),
      },
      {
        type: "update",
        // user is only allowed to update certain of their own fields
        validator: async (inputs) => {
          const { req, rootResolver, fieldPath, query, processedArgs } =
            await processRootResolverArgs(inputs);

          if (
            isCurrentUser(req, processedArgs.item) &&
            objectOnlyHasFields(processedArgs.fields, [
              "avatarUrl",
              "name",
              "description",
              "isPublic",
              "allowEmailNotifications",
              "notificationMethods",
            ])
          ) {
            return;
          }

          throw new PermissionsError();
        },
        resolver: generateUpdateRootResolver({
          service: User,
          options: {
            fields: ["role", "firebaseUid"],
            async afterUpdate({
              inputs: { processedArgs },
              item,
              updatedFieldsObject,
              transaction,
            }) {
              // update firebase user fields
              const firebaseUserFields = {
                ...("name" in processedArgs.fields && {
                  displayName: processedArgs.fields.name,
                }),
                ...("avatarUrl" in processedArgs.fields && {
                  photoURL: processedArgs.fields.avatarUrl,
                }),
                ...("email" in processedArgs.fields && {
                  email: processedArgs.fields.email,
                }),
                ...("password" in processedArgs.fields && {
                  password: processedArgs.fields.password,
                }),
              };

              if (Object.keys(firebaseUserFields).length > 0) {
                await auth().updateUser(item.firebaseUid, firebaseUserFields);
              }
            },
          },
        }),
      },
      {
        type: "delete",
        validator: Validators.allowIfAdmin(),
        resolver: generateDeleteRootResolver({
          service: User,
          options: {
            fields: ["firebaseUid"],
            async afterDelete({ inputs, item, transaction }) {
              // remove firebase auth user
              await auth().deleteUser(item.firebaseUid);
            },
          },
        }),
      },
      { type: "stats" },
    ],
  }),

  userGetCurrent: new GiraffeqlRootResolverType({
    name: "userGetCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    validator: Validators.allowAlways(),
    resolver: async (inputs) => {
      const { req, rootResolver, fieldPath, args, query } = inputs;

      if (!req.user) {
        throw new Error(`Login is required`);
      }

      const results = await getObjectType({
        typename: User.typename,
        req,
        rootResolver,
        fieldPath,
        externalQuery: query,
        sqlParams: {
          where: {
            id: req.user!.id,
          },
          limit: 1,
          specialParams: await User.getSpecialParams(inputs),
        },
      });

      if (results.length < 1) {
        throw new ItemNotFoundError({ fieldPath });
      }

      return results[0];
    },
  }),

  // syncs the user's email with their firebase email, in case they fall out of sync (due to updating email, etc)
  userSyncCurrent: new GiraffeqlRootResolverType({
    name: "userSyncCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    validator: Validators.allowAlways(),
    resolver: async (inputs) => {
      const { req, rootResolver, fieldPath, args, query } = inputs;

      // login required
      if (!req.user) throw new Error(`Login required`);

      // check if record exists
      const item = await User.getFirstSqlRecord(
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
        await User.updateSqlRecord(
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

      return User.getReturnQuery({
        id: req.user.id,
        inputs,
      });
    },
  }),
};
