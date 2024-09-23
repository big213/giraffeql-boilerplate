import { ApiKey } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: ApiKey,
    methods: [
      { type: "get", restOptions: {} },
      { type: "getPaginator", restOptions: {} },
      { type: "delete" },
      { type: "create" },
      { type: "update" },
    ],
  }),
};
