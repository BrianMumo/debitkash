import { getMpesaToken } from "./token";
import { getBaseUrl, getCallbackBaseUrl } from "./config";
import { getSecurityCredential } from "./security";
import type { BalanceRequestPayload } from "@/types/mpesa";

interface BalanceApiResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export async function requestAccountBalance(): Promise<BalanceApiResponse> {
  const token = await getMpesaToken();

  const securityCredential = getSecurityCredential();
  const callbackBaseUrl = getCallbackBaseUrl();

  const payload: BalanceRequestPayload = {
    Initiator: process.env.MPESA_INITIATOR_NAME!,
    SecurityCredential: securityCredential,
    CommandID: "AccountBalance",
    PartyA: process.env.MPESA_SHORTCODE!,
    IdentifierType: "4",
    Remarks: "Balance inquiry",
    QueueTimeOutURL: `${callbackBaseUrl}/api/mpesa/callback/balance-timeout`,
    ResultURL: `${callbackBaseUrl}/api/mpesa/callback/balance-result`,
  };

  const response = await fetch(
    `${getBaseUrl()}/mpesa/accountbalance/v1/query`,
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
        `Balance query failed with status ${response.status}`
    );
  }

  return response.json();
}
