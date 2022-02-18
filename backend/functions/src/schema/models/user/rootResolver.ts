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
    restOptions: {
      method: "get",
      route: "/currentUser",
      query: User.presets.default,
    },
    allowNull: false,
    type: User.typeDefLookup,
    resolver: ({ req, fieldPath, args, query }) => {
      if (!req.user?.id) throw new Error("Login required");
      return User.getRecord({
        req,
        fieldPath,
        args: { id: req.user?.id },
        query,
        isAdmin: true,
      });
      // always allow user to get own user
    },
  }),

  // syncs the user's email with their firebase email
  syncCurrentUser: new GiraffeqlRootResolverType({
    name: "syncCurrentUser",
    restOptions: {
      method: "post",
      route: "/syncCurrentUser",
      query: User.presets.default,
    },
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

  ...generateBaseRootResolvers(User, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
