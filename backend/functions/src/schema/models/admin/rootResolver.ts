import { Scalars } from "../../scalars";
import { Admin } from "../../services";
import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";

export default {
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
          params: new GiraffeqlInputFieldType({
            allowNull: true,
            type: Scalars.unknown,
          }),
        },
      }),
    }),
    resolver: (inputs) => Admin.executeGoogleApiRequest(inputs),
  }),
  getRepositoryReleases: new GiraffeqlRootResolverType({
    name: "getRepositoryReleases",
    type: Scalars.unknown,
    allowNull: false,
    arrayOptions: {
      allowNullElement: false,
    },
    args: new GiraffeqlInputFieldType({
      required: true,
      type: new GiraffeqlInputType({
        name: "getRepositoryReleases",
        description: "Input object for getRepositoryReleases",
        fields: {
          first: new GiraffeqlInputFieldType({
            type: Scalars.positiveNumber,
            required: true,
          }),
        },
      }),
    }),
    resolver: (inputs) => Admin.getRepositoryReleases(inputs),
  }),

  getRepositoryLatestVersion: new GiraffeqlRootResolverType({
    name: "getRepositoryLatestVersion",
    type: Scalars.unknown,
    allowNull: true,
    resolver: (inputs) => Admin.getRepositoryLatestVersion(inputs),
  }),
};
