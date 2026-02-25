import { NextResponse } from "next/server";
import { getBaseUrl, getCallbackBaseUrl, getEnvironment } from "@/lib/mpesa/config";
import { getMpesaToken } from "@/lib/mpesa/token";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, unknown> = {};

  checks.environment = getEnvironment();
  checks.baseUrl = getBaseUrl();
  checks.callbackBaseUrl = getCallbackBaseUrl();
  checks.hasConsumerKey = !!process.env.MPESA_CONSUMER_KEY;
  checks.hasConsumerSecret = !!process.env.MPESA_CONSUMER_SECRET;
  checks.hasSecurityCredential = !!process.env.MPESA_SECURITY_CREDENTIAL;
  checks.shortcode = process.env.MPESA_SHORTCODE;
  checks.initiatorName = process.env.MPESA_INITIATOR_NAME;

  // Test token generation
  try {
    const token = await getMpesaToken();
    checks.tokenOk = true;
    checks.tokenPrefix = token.substring(0, 10) + "...";
  } catch (error) {
    checks.tokenOk = false;
    checks.tokenError = String(error);
  }

  return NextResponse.json(checks);
}
