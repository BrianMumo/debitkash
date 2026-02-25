import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("B2C Timeout Callback:", JSON.stringify(body, null, 2));

    const result = body.Result;
    const conversationId = result?.ConversationID;

    if (conversationId) {
      const transaction = await prisma.transaction.findUnique({
        where: { conversationId },
      });

      if (transaction && transaction.status === "PENDING") {
        await prisma.transaction.update({
          where: { conversationId },
          data: {
            status: "TIMED_OUT",
            resultCode: result?.ResultCode,
            resultDesc: result?.ResultDesc || "Request timed out",
          },
        });
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("B2C timeout callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
