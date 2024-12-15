import { UserUserFollowLink } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: UserUserFollowLink,
    methods: [
      { type: "get" },
      { type: "getPaginator" },
      { type: "delete" },
      { type: "create" },
      { type: "update" },
    ],
  }),
};
