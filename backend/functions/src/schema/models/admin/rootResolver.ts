import { Admin } from "../../services";
import * as Scalars from "../../scalars";
import { GiraffeqlInputFieldType, GiraffeqlRootResolverType } from "giraffeql";

export default {
  executeAdminFunction: new GiraffeqlRootResolverType({
    name: "executeAdminFunction",
    restOptions: {
      method: "get",
      route: "/executeAdminFunction",
    },
    type: Scalars.unknown,
    allowNull: false,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: Scalars.string,
    }),
    resolver: (inputs) => Admin.executeAdminFunction(inputs),
  }),
};
