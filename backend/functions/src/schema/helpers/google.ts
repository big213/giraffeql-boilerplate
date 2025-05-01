import { credential } from "firebase-admin";
import { projectID } from "firebase-functions/params";

export async function executeGoogleApiRequest({
  method,
  url,
  params,
  headers,
  overrideAccessToken,
}: {
  method: "post" | "get";
  url: string;
  params?: any;
  headers?: any;
  overrideAccessToken?: string; // if provided, will use this instead of the application default credentials (mainly for local dev envs where the ADC is not available)
}) {
  const accessToken =
    overrideAccessToken ??
    (await credential
      .applicationDefault()
      .getAccessToken()
      .then((res) => res.access_token));

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body: params ? JSON.stringify(params) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP Error, status: ${response.status}`);
  }

  const data = await response.json();

  return data.data;
}

export async function getAddressInformation({
  address,
  countryCode,
}: {
  address: string;
  countryCode: string;
}): Promise<any> {
  const data = await executeGoogleApiRequest({
    method: "post",
    url: "https://addressvalidation.googleapis.com/v1:validateAddress",
    params: {
      address: {
        regionCode: countryCode,
        addressLines: [address],
      },
    },
    headers: {
      "X-Goog-User-Project": projectID.value(),
    },
  });

  return data.result;
}

// addressResponse corresponds to the return type of getAddressInformation
export function isAddressValid(addressResponse) {
  return (
    addressResponse.verdict.addressComplete &&
    addressResponse.verdict.validationGranularity === "PREMISE" &&
    addressResponse.address.formattedAddress
  );
}

export function generateAddressSqlFields(addressResponse) {
  const postalAddress = addressResponse.address.postalAddress;

  return {
    // replace with formattedAddress
    formattedAddress: addressResponse.address.formattedAddress,
    // populate special location fields
    location: {
      lines: postalAddress.addressLines,
      city: postalAddress.locality,
      state: postalAddress.administrativeArea,
      postalCode: postalAddress.postalCode,
      country: postalAddress.regionCode,
      plusCode: addressResponse.geocode.plusCode.globalCode,
    },
    state: postalAddress.administrativeArea,
    country: postalAddress.regionCode,
    latitude: addressResponse.geocode.location.latitude,
    longitude: addressResponse.geocode.location.longitude,
  };
}
