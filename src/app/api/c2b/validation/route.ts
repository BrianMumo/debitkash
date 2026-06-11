import { NextResponse } from "next/server";

// Safaricom only calls this if "External Validation" is enabled on the shortcode.
// We accept every payment; returning a non-zero ResultCode would reject it.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("C2B Validation:", JSON.stringify(body, null, 2));
  } catch {
    // ignore body parse errors
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
