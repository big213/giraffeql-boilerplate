import { githubToken } from "../../config";

export async function executeGithubGraphqlRequest({ query }: { query: any }) {
  const response = await fetch(`https://api.github.com/graphql`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${githubToken.value()}`,
    },
    method: "POST",
    body: JSON.stringify({ query, variables: null }),
  });

  if (!response.ok) throw new Error(`HTTP Error, status: ${response.status}`);

  const data = await response.json();

  return data.data;
}
