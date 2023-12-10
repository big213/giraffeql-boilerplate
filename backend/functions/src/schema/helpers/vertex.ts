import axios from "axios";
import { credential } from "firebase-admin";

export async function getVertexResponse(query: string) {
  const accessToken = await credential.applicationDefault().getAccessToken();

  const { data } = await axios.request({
    url: "https://us-central1-aiplatform.googleapis.com/v1/projects/giraffeql-boilerplate/locations/us-central1/publishers/google/models/text-bison:predict",
    method: "post",
    headers: {
      Authorization: `Bearer ${accessToken.access_token}`,
    },
    data: {
      instances: [
        {
          content: query,
        },
      ],
      parameters: {
        candidateCount: 1,
        maxOutputTokens: 1024,
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    },
  });

  return data.predictions[0].content;
}
