import { User } from "../../services";
import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
  generateDeleteRootResolver,
  generateGetPaginatorRootResolver,
  generateUpdateRootResolver,
} from "../../core/helpers/rootResolver";
import { GiraffeqlRootResolverType, lookupSymbol } from "giraffeql";
import { Scalars } from "../../scalars";
import { ValidatorGenerators } from "../../core/helpers/validator";
import { getObjectType } from "../../core/helpers/resolver";
import { ItemNotFoundError, PermissionsError } from "../../core/helpers/error";
import { auth } from "firebase-admin";
import {
  filterPassesTest,
  isCurrentUser,
} from "../../core/helpers/permissions";
import { objectOnlyHasFields } from "../../core/helpers/shared";

export default {
  ...generateBaseRootResolvers({
    service: User,
    methods: [
      {
        type: "get",
        /*
        Allow if:
        - item.id is currentUser
        - item isPublic === true AND requested fields has fields id, name, avatarUrl, email, isPublic, currentUserFollowLink ONLY
        - OR, if requested fields are id, name, avatarUrl, isPublic, currentUserFollowLink  ONLY
        */
        validator: async ({ req, args, query }) => {
          const record = await User.getFirstSqlRecord(
            {
              select: ["id", "isPublic"],
              where: args,
            },
            true
          );

          if (isCurrentUser(req, record.id)) return;

          if (
            query &&
            objectOnlyHasFields(query, [
              "id",
              "__typename",
              "name",
              "avatarUrl",
              "description",
              "isPublic",
              "currentUserFollowLink",
            ]) &&
            record.isPublic
          ) {
            return;
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
            return;
          }

          throw new PermissionsError();
        },
      },
      {
        type: "getPaginator",
        // not allowed (except by admins)
        /*
        Allow if:
        - filtering by isPublic === true
        - if requested fields are id, name, avatarUrl, isPublic, currentUserFollowLink ONLY, or NO query
        */
        validator: async ({ args, query }) => {
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
            return;
          }

          throw new PermissionsError();
        },
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
        validator: ValidatorGenerators.allowIfAdmin(),
        resolver: generateCreateRootResolver({
          service: User,
          options: {
            async getCreateFields({ inputs: { args }, transaction }) {
              // create firebase user
              const firebaseUser = await auth().createUser({
                email: args.email,
                emailVerified: false,
                password: args.password,
                displayName: args.name,
                disabled: false,
                photoURL: args.avatarUrl,
              });
              return {
                firebaseUid: firebaseUser.uid,
              };
            },
          },
        }),
      },
      {
        type: "update",
        resolver: generateUpdateRootResolver({
          service: User,
          options: {
            fields: ["role", "firebaseUid"],
            async afterUpdate({
              inputs: { args },
              item,
              updatedFieldsObject,
              transaction,
            }) {
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
            },
          },
        }),
      },
      {
        type: "delete",
        validator: ValidatorGenerators.allowIfAdmin(),
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
    validator: ValidatorGenerators.allowAlways(),
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
          specialParams: await User.getSpecialParams({
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
    },
  }),

  // syncs the user's email with their firebase email, in case they fall out of sync (due to updating email, etc)
  userSyncCurrent: new GiraffeqlRootResolverType({
    name: "userSyncCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    validator: ValidatorGenerators.allowAlways(),
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
