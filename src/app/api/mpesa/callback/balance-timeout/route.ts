import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Balance Timeout Callback:", JSON.stringify(body, null, 2));

    const result = body.Result;
    const conversationId = result?.ConversationID;

    if (conversationId) {
      const snapshot = await prisma.balanceSnapshot.findUnique({
        where: { conversationId },
      });

      if (snapshot && snapshot.status === "PENDING") {
        await prisma.balanceSnapshot.update({
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
    console.error("Balance timeout callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
