import { UserUserFollowLink } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: UserUserFollowLink,
    methods: ["get", "getPaginator", "stats", "delete", "create", "update"],
    restMethods: ["get", "getPaginator"],
  }),
};
