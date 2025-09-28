import { paypalApiUrl, paypalClientId, paypalClientSecret } from "../../config";

let accessToken;

async function generateAccessToken() {
  try {
    if (!paypalClientId.value() || !paypalClientSecret.value()) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      paypalClientId.value() + ":" + paypalClientSecret.value()
    ).toString("base64");

    const response = await fetch(`${paypalApiUrl.value()}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (err) {
    throw new Error(`Error generating PayPal access token`);
  }
}

export async function executePaypalRequest({
  path,
  method,
  payload,
}: {
  path;
  method: "POST" | "GET";
  payload?;
}) {
  if (!accessToken) {
    accessToken = await generateAccessToken();
  }

  const response = await fetch(`${paypalApiUrl.value()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) throw new Error(`HTTP Error, status: ${response.status}`);

  return response.json();
}

export async function createPaypalOrder(amount, referenceId) {
  return executePaypalRequest({
    path: "/v2/checkout/orders",
    method: "POST",
    payload: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: referenceId,
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "Cubing.GG",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    },
  });
}

export async function capturePaypalOrder(orderId) {
  return executePaypalRequest({
    path: `/v2/checkout/orders/${orderId}/capture`,
    method: "POST",
  });
}

export async function getPaypalOrder(orderId) {
  return executePaypalRequest({
    path: `/v2/checkout/orders/${orderId}`,
    method: "GET",
  });
}

export async function refundPaypalOrder(orderId, amount, memo) {
  // need to first get the capture_id
  const paypalOrder = await getPaypalOrder(orderId);

  const capture = paypalOrder.purchase_units[0]?.payments?.captures[0];

  if (!capture) {
    throw new Error(`Invalid PayPal payment -- capture not successful`);
  }

  return executePaypalRequest({
    path: `/v2/payments/captures/${capture.id}/refund`,
    method: "POST",
    payload: {
      note_to_payer: memo ?? "Refund issued",
      amount: {
        value: amount,
        currency_code: "USD",
      },
    },
  });
}
