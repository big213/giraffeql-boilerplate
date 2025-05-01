import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { executeGoogleApiRequest } from "../../helpers/google";
import { githubOrganization, githubRepository } from "../../../config";
import { executeGithubGraphqlRequest } from "../../helpers/github";

export class AdminService extends BaseService {
  accessControl: AccessControlMap = {
    // google: () => true,
    validateAddress: () => true,
    releases: () => true,
  };

  @permissionsCheck("google")
  async executeGoogleApiRequest({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs) {
    const data = await executeGoogleApiRequest({
      method: args.method,
      url: args.url,
      params: args.data,
    });

    return data;
  }

  @permissionsCheck("releases")
  async getRepositoryReleases({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs): Promise<any> {
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
  }

  @permissionsCheck("releases")
  async getRepositoryLatestVersion({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs): Promise<any> {
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
  }
}
