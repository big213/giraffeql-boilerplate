import { File } from "../../services";
import { generateBaseRootResolvers } from "../../core/helpers/rootResolver";

export default {
  ...generateBaseRootResolvers(File, [
    "get",
    "getMultiple",
    "delete",
    "create",
    "update",
  ]),
};
