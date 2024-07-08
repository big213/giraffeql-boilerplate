import { ApiKey } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: ApiKey,
    methods: ["get", "getPaginator", "stats", "delete", "create", "update"],
  }),
};
