import { ApiKey } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: ApiKey,
    methods: ["get", "getMultiple", "delete", "create", "update"],
  }),
};
