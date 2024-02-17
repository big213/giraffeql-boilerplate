import axios, { Method } from "axios";
import { credential } from "firebase-admin";
import { projectID } from "firebase-functions/params";

export async function getGoogleApiResponse({
  method,
  url,
  data,
  headers,
}: {
  method: Method;
  url: string;
  data: any;
  headers?: any;
}) {
  try {
    const accessToken = await credential.applicationDefault().getAccessToken();

    const { data: responseData } = await axios.request({
      url,
      method,
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
        ...headers,
      },
      data,
    });

    return responseData;
  } catch (err: any) {
    return err.response.data.error;
  }
}

export async function getAddressInformation({
  address,
  countryCode,
}: {
  address: string;
  countryCode: string;
}): Promise<any> {
  const data = await getGoogleApiResponse({
    method: "post",
    url: "https://addressvalidation.googleapis.com/v1:validateAddress",
    data: {
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
