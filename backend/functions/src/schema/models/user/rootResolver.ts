import { auth } from "firebase-admin";
import {
  GiraffeqlInputFieldType,
  GiraffeqlRootResolverType,
  lookupSymbol,
} from "giraffeql";
import { PermissionsError } from "../../core/helpers/error";
import {
  isCurrentUser,
  validateQueryFields,
} from "../../core/helpers/permissions";
import {
  generateBaseRootResolvers,
  generateCreateRootResolver,
  generateDeleteRootResolver,
  generateGetPaginatorRootResolver,
  generateRootResolverTypeAction,
  generateUpdateRootResolver,
  processRootResolverArgs,
} from "../../core/helpers/rootResolver";
import { objectOnlyHasFields } from "../../core/helpers/shared";
import { Validators } from "../../helpers/validator";
import { Scalars } from "../../scalars";
import { File, User } from "../../services";
import { generateServingUrl } from "../../helpers/file";
import { Knex } from "knex";

const allowedQueryFields = [
  "id",
  "__typename",
  "name",
  "avatar",
  "description",
  "currentUserFollowLink",
];

function getAvatarUrl(fileId: string, transaction: Knex.Transaction) {
  // fetch the avatar location
  return fileId
    ? File.getFirstSqlRecord({
        select: ["location"],
        where: {
          id: fileId,
        },
        transaction,
      })
    : null;
}

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
        /*
        Allow if:
        - filtering by isPublic === true
        - if requested fields are id, name, avatar, currentUserFollowLink ONLY, or NO query
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
                avatar: {
                  servingUrl: lookupSymbol,
                },
              },
            },
          },
        },
      },
      {
        type: "create",
        validator: Validators.allowIfAdmin(),
        additionalArgs: {
          password: new GiraffeqlInputFieldType({
            required: true,
            allowNull: false,
            type: Scalars.string,
          }),
        },
        resolver: generateCreateRootResolver({
          service: User,
          options: {
            async getCreateFields({ inputs: { processedArgs }, transaction }) {
              // fetch the avatar location
              const avatarFile = processedArgs.avatar
                ? await File.getFirstSqlRecord({
                    select: ["location"],
                    where: {
                      id: processedArgs.avatar,
                    },
                  })
                : null;

              // create firebase user
              const firebaseUser = await auth().createUser({
                email: processedArgs.email,
                emailVerified: false,
                password: processedArgs.password,
                displayName: processedArgs.name,
                disabled: false,
                photoURL: await getAvatarUrl(processedArgs.avatar, transaction),
              });

              delete processedArgs.password;

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
        validator: async (inputs) => {
          const { req, rootResolver, fieldPath, query, processedArgs } =
            await processRootResolverArgs(inputs);

          if (
            isCurrentUser(req, processedArgs.item) &&
            objectOnlyHasFields(processedArgs.fields, [
              "avatar",
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
            fields: ["name", "avatar", "email", "role", "firebaseUid"],

            async getUpdateFields({
              inputs: { processedArgs },
              item,
              data,
              updatedFieldsObject,
              transaction,
            }) {
              // update firebase user fields
              const firebaseUserFields = {
                ...(updatedFieldsObject.name !== undefined && {
                  displayName: processedArgs.fields.name,
                }),
                ...(updatedFieldsObject.avatarUrl !== undefined && {
                  photoURL: await getAvatarUrl(
                    processedArgs.fields.avatar,
                    transaction
                  ),
                }),
                ...(updatedFieldsObject.email !== undefined && {
                  email: processedArgs.fields.email,
                }),
              };

              if (Object.keys(firebaseUserFields).length > 0) {
                await auth().updateUser(item.firebaseUid, firebaseUserFields);
              }

              return {
                ...processedArgs.fields,
              };
            },
          },
        }),
      },
      {
        type: "delete",
        validator: Validators.allowIfLoggedIn(),
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

  userSetPassword: generateRootResolverTypeAction({
    service: User,
    operation: "setPassword",
    argFields: {
      password: new GiraffeqlInputFieldType({
        required: true,
        allowNull: false,
        type: Scalars.string,
      }),
    },
    validator: Validators.allowIfAdmin(),
    resolver: async (inputs) => {
      const { req, rootResolver, fieldPath, processedArgs, query } =
        await processRootResolverArgs(inputs);
      const item = await User.getFirstSqlRecord(
        {
          select: ["firebaseUid"],
          where: {
            id: processedArgs.item,
          },
        },
        true
      );

      await auth().updateUser(item.firebaseUid, {
        password: processedArgs.password,
      });

      return User.getReturnQuery({
        id: processedArgs.item,
        inputs,
      });
    },
  }),

  userGetCurrent: new GiraffeqlRootResolverType({
    name: "userGetCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    validator: Validators.allowIfLoggedIn(),
    resolver: async (inputs) => {
      const { req, rootResolver, fieldPath, query, processedArgs } =
        await processRootResolverArgs(inputs);

      return User.getReturnQuery({
        id: req.user!.id,
        inputs,
      });
    },
  }),

  // syncs the user's email with their firebase email, in case they fall out of sync (due to updating email, etc)
  userSyncCurrent: new GiraffeqlRootResolverType({
    name: "userSyncCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    validator: Validators.allowAlways(),
    resolver: async (inputs) => {
      const { req, rootResolver, fieldPath, query, processedArgs } =
        await processRootResolverArgs(inputs);

      // check if record exists
      const item = await User.getFirstSqlRecord(
        {
          select: ["id", "email", "firebaseUid"],
          where: {
            id: req.user!.id,
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
              id: req.user!.id,
            },
          },
          true
        );
      }

      return User.getReturnQuery({
        id: req.user!.id,
        inputs,
      });
    },
  }),
};
