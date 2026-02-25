import { getMpesaToken } from "./token";
import { getBaseUrl, getCallbackBaseUrl } from "./config";
import { getSecurityCredential } from "./security";
import type { B2CRequestPayload, B2CApiResponse } from "@/types/mpesa";

interface B2CRequest {
  phoneNumber: string; // Format: 254XXXXXXXXX
  amount: number;
  commandId: "SalaryPayment" | "BusinessPayment" | "PromotionPayment";
  remarks?: string;
  occasion?: string;
}

export async function initiateB2CPayment(
  request: B2CRequest
): Promise<B2CApiResponse> {
  const token = await getMpesaToken();

  const securityCredential = getSecurityCredential();
  const callbackBaseUrl = getCallbackBaseUrl();

  const payload: B2CRequestPayload = {
    InitiatorName: process.env.MPESA_INITIATOR_NAME!,
    SecurityCredential: securityCredential,
    CommandID: request.commandId,
    Amount: request.amount,
    PartyA: process.env.MPESA_SHORTCODE!,
    PartyB: request.phoneNumber,
    Remarks: request.remarks || "Payment",
    QueueTimeOutURL: `${callbackBaseUrl}/api/mpesa/callback/b2c-timeout`,
    ResultURL: `${callbackBaseUrl}/api/mpesa/callback/b2c-result`,
    Occassion: request.occasion || "",
  };

  const response = await fetch(
    `${getBaseUrl()}/mpesa/b2c/v1/paymentrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { errorMessage?: string }).errorMessage ||
        `B2C request failed with status ${response.status}`
    );
  }

  return response.json();
}
