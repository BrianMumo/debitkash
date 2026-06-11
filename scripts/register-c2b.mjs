// One-time registration of the C2B confirmation/validation URLs with Safaricom.
//
// Run this ONCE after the app is live at the production domain:
//   node scripts/register-c2b.mjs
//
// Override the public base URL if needed:
//   node scripts/register-c2b.mjs https://www.debitkash.com
//
// Reads MPESA_* credentials from .env.local. Safe to run from any machine — it
// just tells Safaricom which URLs to call; the endpoints must be deployed/live.

import { config } from "dotenv";
config({ path: ".env.local" });

const PUBLIC_BASE_URL = process.argv[2] || "https://www.debitkash.com";

const key = process.env.MPESA_CONSUMER_KEY;
const secret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const base =
  process.env.MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

if (!key || !secret || !shortcode) {
  console.error("Missing MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET / MPESA_SHORTCODE in .env.local");
  process.exit(1);
}

// NOTE: Safaricom rejects URLs containing blocked keywords (mpesa, safaricom,
// exe, exec, cmd, sql, query), so the C2B routes live under /api/c2b/ — not /api/mpesa/.
const confirmationURL = `${PUBLIC_BASE_URL}/api/c2b/confirmation`;
const validationURL = `${PUBLIC_BASE_URL}/api/c2b/validation`;

console.log("Environment :", process.env.MPESA_ENVIRONMENT);
console.log("Shortcode   :", shortcode);
console.log("Confirmation:", confirmationURL);
console.log("Validation  :", validationURL);
console.log("");

// 1. OAuth token
const creds = Buffer.from(`${key}:${secret}`).toString("base64");
const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
  headers: { Authorization: `Basic ${creds}` },
});
if (!tokenRes.ok) {
  console.error(`❌ OAuth failed: ${tokenRes.status} ${tokenRes.statusText}`);
  process.exit(1);
}
const { access_token } = await tokenRes.json();

// 2. Register URLs
const regRes = await fetch(`${base}/mpesa/c2b/v1/registerurl`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ShortCode: shortcode,
    ResponseType: "Completed", // auto-complete payment if validation URL is unreachable
    ConfirmationURL: confirmationURL,
    ValidationURL: validationURL,
  }),
});

const body = await regRes.text();
console.log("Register status:", regRes.status, regRes.statusText);
console.log("Response:", body);

if (regRes.ok) {
  console.log("\n✅ C2B URLs registered. Incoming paybill payments will now POST to your site.");
} else {
  console.log("\n❌ Registration failed. Note: a shortcode can usually only be registered once;");
  console.log("   if it was already registered, contact Safaricom to reset, or it may already be active.");
}
