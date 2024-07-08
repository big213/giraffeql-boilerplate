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
    resolver: (inputs) => User.syncRecord(inputs),
  }),

  ...generateBaseRootResolvers({
    service: User,
    methods: ["get", "getPaginator", "stats", "delete", "create", "update"],
    restMethods: ["get", "getPaginator"],
  }),
};
