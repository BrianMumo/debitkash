import { NextResponse } from "next/server";
import { getBaseUrl, getCallbackBaseUrl } from "@/lib/mpesa/config";
import { getMpesaToken } from "@/lib/mpesa/token";
import { getSecurityCredential } from "@/lib/mpesa/security";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, unknown> = {};

  const callbackBaseUrl = getCallbackBaseUrl();
  checks.callbackBaseUrl = callbackBaseUrl;

  // Test token
  let token = "";
  try {
    token = await getMpesaToken();
    checks.tokenOk = true;
  } catch (error) {
    checks.tokenOk = false;
    checks.tokenError = String(error);
    return NextResponse.json(checks);
  }

  // Build the exact payload that would be sent
  const payload = {
    Initiator: process.env.MPESA_INITIATOR_NAME!,
    SecurityCredential: getSecurityCredential(),
    CommandID: "AccountBalance",
    PartyA: process.env.MPESA_SHORTCODE!,
    IdentifierType: "4",
    Remarks: "Balance inquiry",
    QueueTimeOutURL: `${callbackBaseUrl}/api/mpesa/callback/balance-timeout`,
    ResultURL: `${callbackBaseUrl}/api/mpesa/callback/balance-result`,
  };

  checks.payload = {
    ...payload,
    SecurityCredential: payload.SecurityCredential.substring(0, 20) + "...",
  };

  // Actually call Safaricom
  try {
    const url = `${getBaseUrl()}/mpesa/accountbalance/v1/query`;
    checks.apiUrl = url;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    checks.httpStatus = response.status;
    checks.safaricomResponse = body;
  } catch (error) {
    checks.fetchError = String(error);
  }

  return NextResponse.json(checks);
}
