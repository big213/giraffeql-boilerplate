import { File } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers({
    service: File,
    methods: ["get", "getMultiple", "delete", "create", "update"],
  }),
};
