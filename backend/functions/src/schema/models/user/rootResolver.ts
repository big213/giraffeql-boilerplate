import { User } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { GiraffeqlRootResolverType, lookupSymbol } from "giraffeql";
import { Scalars } from "../../scalars";

export default {
  getCurrentUser: new GiraffeqlRootResolverType({
    name: "getCurrentUser",
    allowNull: false,
    type: User.typeDefLookup,
    resolver: (inputs) => User.getCurrentUser(inputs),
  }),

  syncCurrentUser: new GiraffeqlRootResolverType({
    name: "syncCurrentUser",
    allowNull: false,
    type: User.typeDefLookup,
    resolver: (inputs) => User.syncRecord(inputs),
  }),

  getCurrentUserAvailablePermissions: new GiraffeqlRootResolverType({
    name: "getCurrentUserAvailablePermissions",
    allowNull: false,
    type: Scalars.userPermission,
    arrayOptions: {
      allowNullElement: false,
    },
    resolver: (inputs) => User.getCurrentUserAvailablePermissions(inputs),
  }),

  ...generateBaseRootResolvers({
    service: User,
    methods: [
      { type: "get" },
      {
        type: "getPaginator",
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
      { type: "delete" },
      { type: "create" },
      { type: "update" },
      { type: "stats" },
    ],
  }),
};
