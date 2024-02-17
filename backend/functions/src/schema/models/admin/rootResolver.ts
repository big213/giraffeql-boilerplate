import { Admin } from "../../services";
import * as Scalars from "../../scalars";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";

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
  executeGoogleApiRequest: new GiraffeqlRootResolverType({
    name: "executeGoogleApiRequest",
    restOptions: {
      method: "post",
      route: "/executeGoogleApiRequest",
      argsTransformer: (req) => req.body,
    },
    type: Scalars.unknown,
    allowNull: true,
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType({
        name: "executeGoogleApiRequestInput",
        fields: {
          method: new GiraffeqlInputFieldType({
            required: true,
            type: Scalars.string,
          }),
          url: new GiraffeqlInputFieldType({
            required: true,
            type: Scalars.url,
          }),
          data: new GiraffeqlInputFieldType({
            allowNull: true,
            type: Scalars.unknown,
          }),
        },
      }),
    }),
    resolver: (inputs) => Admin.executeGoogleApiRequest(inputs),
  }),
};
