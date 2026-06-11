import { getMpesaToken } from "./token";
import { getBaseUrl, getCallbackBaseUrl } from "./config";
import { getSecurityCredential } from "./security";
import type { ReversalRequestPayload, ReversalApiResponse } from "@/types/mpesa";

interface ReversalRequest {
  transactionId: string; // the original M-Pesa receipt, e.g. "UFB8V7S1YI"
  amount: number;
  remarks?: string;
  occasion?: string;
}

export async function initiateReversal(
  request: ReversalRequest
): Promise<ReversalApiResponse> {
  const token = await getMpesaToken();
  const securityCredential = getSecurityCredential();
  const callbackBaseUrl = getCallbackBaseUrl();

  const payload: ReversalRequestPayload = {
    Initiator: process.env.MPESA_INITIATOR_NAME!,
    SecurityCredential: securityCredential,
    CommandID: "TransactionReversal",
    TransactionID: request.transactionId,
    Amount: request.amount,
    ReceiverParty: process.env.MPESA_SHORTCODE!,
    RecieverIdentifierType: "11",
    QueueTimeOutURL: `${callbackBaseUrl}/api/mpesa/callback/reversal-timeout`,
    ResultURL: `${callbackBaseUrl}/api/mpesa/callback/reversal-result`,
    Remarks: request.remarks || "Reversal",
    Occasion: request.occasion || "",
  };

  const response = await fetch(`${getBaseUrl()}/mpesa/reversal/v1/request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { errorMessage?: string }).errorMessage ||
        `Reversal request failed with status ${response.status}`
    );
  }

  return response.json();
}
