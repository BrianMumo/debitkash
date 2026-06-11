import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ReversalCallbackResult } from "@/types/mpesa";

export async function POST(request: Request) {
  try {
    const body: ReversalCallbackResult = await request.json();
    console.log("Reversal Result Callback:", JSON.stringify(body, null, 2));

    const result = body.Result;
    const reversalConversationId = result?.ConversationID;
    const resultCode = result?.ResultCode;
    const resultDesc = result?.ResultDesc;

    if (!reversalConversationId) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { reversalConversationId },
    });

    if (!transaction) {
      console.warn(`No transaction for reversal ConversationID: ${reversalConversationId}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Idempotency: only act while still pending.
    if (transaction.reversalStatus !== "PENDING") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await prisma.transaction.update({
      where: { reversalConversationId },
      data: {
        reversalStatus: resultCode === 0 ? "SUCCESS" : "FAILED",
        reversalResultCode: resultCode,
        reversalResultDesc: resultDesc,
        reversalCompletedAt: new Date(),
      },
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("Reversal result callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
