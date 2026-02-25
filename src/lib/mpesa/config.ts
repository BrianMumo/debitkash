export const MPESA_CONFIG = {
  sandbox: {
    baseUrl: "https://sandbox.safaricom.co.ke",
  },
  production: {
    baseUrl: "https://api.safaricom.co.ke",
  },
} as const;

export type MpesaEnvironment = keyof typeof MPESA_CONFIG;

export function getEnvironment(): MpesaEnvironment {
  return (process.env.MPESA_ENVIRONMENT || "sandbox") as MpesaEnvironment;
}

export function getBaseUrl(): string {
  return MPESA_CONFIG[getEnvironment()].baseUrl;
}

export function getCallbackBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
