import axios from "axios";
import { credential } from "firebase-admin";

export async function getVertexResponse({
  query,
  url,
  data,
}: {
  query: string;
  url: string;
  data: any;
}) {
  const accessToken = await credential.applicationDefault().getAccessToken();

  const { data: responseData } = await axios.request({
    url,
    method: "post",
    headers: {
      Authorization: `Bearer ${accessToken.access_token}`,
    },
    data,
  });

  return responseData;
}
