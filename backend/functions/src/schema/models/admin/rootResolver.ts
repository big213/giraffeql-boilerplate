import {
  GiraffeqlInputFieldType,
  GiraffeqlInputType,
  GiraffeqlRootResolverType,
} from "giraffeql";
import { githubOrganization, githubRepository } from "../../../config";
import { executeGithubGraphqlRequest } from "../../helpers/github";
import { executeGoogleApiRequest } from "../../helpers/google";
import { Scalars } from "../../scalars";
import { ValidatorGenerators } from "../../core/helpers/validator";

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
    validator: ValidatorGenerators.allowIfAdmin(),
    resolver: async ({ args }) => {
      const data = await executeGoogleApiRequest({
        method: args.method,
        url: args.url,
        params: args.data,
      });

      return data;
    },
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
    validator: () => {
      console.log(1);
    },
    resolver: async ({ args }) => {
      console.log(2);
      try {
        if (githubOrganization.value()) {
          const response = await executeGithubGraphqlRequest({
            query: `
              query { 
                viewer { 
                  organization(login: "${githubOrganization.value()}") {
                    repository(name: "${githubRepository.value()}") {
                      releases(first: ${args.first}, orderBy: {
                        field: CREATED_AT,
                        direction: DESC
                      }) {
                        edges {
                          node {
                            id
                            tagName
                            name
                            descriptionHTML
                            isLatest
                            publishedAt
                          }
                        }
                      }
                    }
                  }
                }
              }
      `,
          });

          return response.viewer.organization.repository.releases.edges.map(
            (edge) => edge.node
          );
        } else {
          // if no organization specified, lookup repository directly
          const response = await executeGithubGraphqlRequest({
            query: `
              query { 
                viewer { 
                  repository(name: "${githubRepository.value()}") {
                    releases(first: ${args.first}, orderBy: {
                      field: CREATED_AT,
                      direction: DESC
                    }) {
                      edges {
                        node {
                          id
                          tagName
                          name
                          descriptionHTML
                          isLatest
                          publishedAt
                        }
                      }
                    }
                  }
                }
              }
      `,
          });

          return response.viewer.repository.releases.edges.map(
            (edge) => edge.node
          );
        }
      } catch (err) {
        throw new Error(
          `Unable to fetch the requested data from the repository provider`
        );
      }
    },
  }),

  getRepositoryLatestVersion: new GiraffeqlRootResolverType({
    name: "getRepositoryLatestVersion",
    type: Scalars.unknown,
    allowNull: true,
    validator: ValidatorGenerators.allowAlways(),
    resolver: async ({ args }) => {
      try {
        if (githubOrganization.value()) {
          const response = await executeGithubGraphqlRequest({
            query: `
              query { 
                viewer { 
                  organization(login: "${githubOrganization.value()}") {
                    repository(name: "${githubRepository.value()}") {
                      latestRelease {
                        tagName
                        publishedAt
                      }
                    }
                  }
                }
              }
      `,
          });

          return response.viewer.organization.repository.latestRelease;
        } else {
          // if no organization specified, lookup repository directly
          const response = await executeGithubGraphqlRequest({
            query: `
              query { 
                viewer { 
                  repository(name: "${githubRepository.value()}") {
                    latestRelease {
                      tagName
                      publishedAt
                    }
                  }
                }
              }
      `,
          });

          return response.viewer.repository.latestRelease;
        }
      } catch (err) {
        throw new Error(
          `Unable to fetch the requested data from the repository provider`
        );
      }
    },
  }),
};
