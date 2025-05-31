import { User } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";
import { GiraffeqlRootResolverType, lookupSymbol } from "giraffeql";
import { Scalars } from "../../scalars";

export default {
  userGetCurrent: new GiraffeqlRootResolverType({
    name: "userGetCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    resolver: (inputs) => User.getCurrentUser(inputs),
  }),

  userSyncCurrent: new GiraffeqlRootResolverType({
    name: "userSyncCurrent",
    allowNull: false,
    type: User.typeDefLookup,
    resolver: (inputs) => User.syncRecord(inputs),
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
