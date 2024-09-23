import { File } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: File,
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
