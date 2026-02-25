import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { B2CCallbackResult } from "@/types/mpesa";

export async function POST(request: Request) {
  try {
    const body: B2CCallbackResult = await request.json();
    console.log("B2C Result Callback:", JSON.stringify(body, null, 2));

    const result = body.Result;
    const conversationId = result.ConversationID;
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;

    // Find the transaction by ConversationID
    const transaction = await prisma.transaction.findUnique({
      where: { conversationId },
    });

    if (!transaction) {
      console.warn(`Transaction not found for ConversationID: ${conversationId}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Skip if already processed (idempotency)
    if (transaction.status !== "PENDING") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (resultCode === 0 && result.ResultParameters) {
      // Success - parse ResultParameters
      const params = result.ResultParameters.ResultParameter;
      const getParam = (key: string) =>
        params.find((p) => p.Key === key)?.Value;

      await prisma.transaction.update({
        where: { conversationId },
        data: {
          status: "SUCCESS",
          resultCode,
          resultDesc,
          mpesaTransactionId: result.TransactionID,
          recipientName: getParam("ReceiverPartyPublicName")?.toString(),
          isRegisteredCustomer:
            getParam("B2CRecipientIsRegisteredCustomer") === "Y",
          chargesAccountBalance: parseBalanceValue(
            getParam("B2CChargesPaidAccountAvailableFunds")
          ),
          utilityAccountBalance: parseBalanceValue(
            getParam("B2CUtilityAccountAvailableFunds")
          ),
          workingAccountBalance: parseBalanceValue(
            getParam("B2CWorkingAccountAvailableFunds")
          ),
          completedAt: new Date(),
        },
      });
    } else {
      // Failure
      await prisma.transaction.update({
        where: { conversationId },
        data: {
          status: "FAILED",
          resultCode,
          resultDesc,
        },
      });
    }

    // Always return 200 to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("B2C callback error:", error);
    // Still return 200 to prevent Safaricom retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

function parseBalanceValue(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}
