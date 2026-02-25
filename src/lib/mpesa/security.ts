export function getSecurityCredential(): string {
  const credential = process.env.MPESA_SECURITY_CREDENTIAL;

  if (!credential) {
    throw new Error(
      "MPESA_SECURITY_CREDENTIAL environment variable is not set. " +
      "Generate it from the Safaricom Daraja portal."
    );
  }

  return credential;
}
