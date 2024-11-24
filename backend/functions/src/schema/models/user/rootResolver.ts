import { User } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { GiraffeqlRootResolverType } from "giraffeql";

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
    resolver: (inputs) => User.getCurrentUser(inputs),
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
    methods: [
      { type: "get", restOptions: {} },
      { type: "getPaginator", restOptions: {} },
      { type: "delete" },
      { type: "create" },
      { type: "update" },
      { type: "stats" },
    ],
  }),
};
