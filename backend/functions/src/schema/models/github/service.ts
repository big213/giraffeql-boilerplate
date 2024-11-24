import { BaseService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";
import { ServiceFunctionInputs } from "../../../types";
import axios from "axios";
import { GiraffeqlBaseError } from "giraffeql";
import {
  githubOrganization,
  githubRepository,
  githubToken,
} from "../../../config";

const graphqlApi = axios.create({
  baseURL: "https://api.github.com",
});

async function sendGraphqlRequest(graphqlQuery) {
  const request = {
    headers: {
      Authorization: "Bearer " + githubToken.value(),
    },
  };

  const params = {
    query: graphqlQuery,
  };
  const { data } = await graphqlApi.post("/graphql", params, request);
  return data.data;
}

export class GithubService extends BaseService {
  accessControl = {
    get: () => true,
  };

  @permissionsCheck("get")
  async getRepositoryReleases({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs): Promise<any> {
    try {
      // args should be validated already
      const validatedArgs = <any>args;

      if (githubOrganization.value()) {
        const response = await sendGraphqlRequest(`
query { 
  viewer { 
    organization(login: "${githubOrganization.value()}") {
      repository(name: "${githubRepository.value()}") {
        releases(first: ${validatedArgs.first}, orderBy: {
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
    `);

        return response.viewer.organization.repository.releases.edges.map(
          (edge) => edge.node
        );
      } else {
        // if no organization specified, lookup repository directly
        const response = await sendGraphqlRequest(`
query { 
  viewer { 
    repository(name: "${githubRepository.value()}") {
      releases(first: ${validatedArgs.first}, orderBy: {
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
    `);

        return response.viewer.repository.releases.edges.map(
          (edge) => edge.node
        );
      }
    } catch (err) {
      throw new GiraffeqlBaseError({
        message:
          "Unable to fetch the requested data from the repository provider",
        fieldPath,
      });
    }
  }

  @permissionsCheck("get")
  async getRepositoryLatestVersion({
    req,
    rootResolver,
    fieldPath,
    args,
    query,
  }: ServiceFunctionInputs): Promise<any> {
    try {
      // args should be validated already
      const validatedArgs = <any>args;

      if (githubOrganization.value()) {
        const response = await sendGraphqlRequest(`
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
    `);

        return response.viewer.organization.repository.latestRelease;
      } else {
        // if no organization specified, lookup repository directly
        const response = await sendGraphqlRequest(`
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
    `);

        return response.viewer.repository.latestRelease;
      }
    } catch (err) {
      throw new GiraffeqlBaseError({
        message:
          "Unable to fetch the requested data from the repository provider",
        fieldPath,
      });
    }
  }
}
