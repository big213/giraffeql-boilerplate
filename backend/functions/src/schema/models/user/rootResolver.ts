import { User } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";
import { Scalars } from "../..";

export default {
  getCurrentUser: new GiraffeqlRootResolverType({
    name: "getCurrentUser",
    ...(User.defaultQuery && {
      restOptions: {
        method: "get",
        route: "/currentUser",
        query: User.defaultQuery,
      },
    }),
    allowNull: false,
    type: User.typeDefLookup,
    resolver: ({ req, fieldPath, args, query }) => {
      if (!req.user) throw new Error("Login required");

      return User.getRecord({
        req,
        fieldPath,
        args: { id: req.user!.id },
        query,
        isAdmin: true,
      });
      // always allow user to get own user
    },
  }),

  // syncs the user's email with their firebase email
  syncCurrentUser: new GiraffeqlRootResolverType({
    name: "syncCurrentUser",
    ...(User.defaultQuery && {
      restOptions: {
        method: "post",
        route: "/syncCurrentUser",
        query: User.defaultQuery,
      },
    }),
    allowNull: false,
    type: User.typeDefLookup,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType({
        name: "syncCurrentUser",
        description: "Input object for syncCurrentUser",
        fields: {
          email: new GiraffeqlInputFieldType({
            type: Scalars.string,
            required: true,
          }),
        },
      }),
    }),
    resolver: ({ req, fieldPath, args, query }) =>
      User.syncRecord({
        req,
        fieldPath,
        args,
        query,
        data: { id: req.user?.id },
      }),
  }),

  ...generateBaseRootResolvers({
    service: User,
    methods: ["get", "getMultiple", "delete", "create", "update"],
    restMethods: ["get", "getMultiple"],
  }),
};
