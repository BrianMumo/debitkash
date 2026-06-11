import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Reversal Timeout Callback:", JSON.stringify(body, null, 2));

    const result = body.Result;
    const reversalConversationId = result?.ConversationID;

    if (reversalConversationId) {
      const transaction = await prisma.transaction.findUnique({
        where: { reversalConversationId },
      });

      if (transaction && transaction.reversalStatus === "PENDING") {
        await prisma.transaction.update({
          where: { reversalConversationId },
          data: {
            reversalStatus: "TIMED_OUT",
            reversalResultCode: result?.ResultCode,
            reversalResultDesc: result?.ResultDesc || "Reversal request timed out",
          },
        });
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("Reversal timeout callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
