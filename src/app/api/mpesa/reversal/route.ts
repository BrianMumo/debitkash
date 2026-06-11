import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateReversal } from "@/lib/mpesa/reversal";
import { z } from "zod";

const reversalSchema = z.object({
  transactionId: z.string().min(1), // our DB transaction id
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = reversalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parsed.data.transactionId },
    });

    if (!transaction || transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only completed payments with an M-Pesa receipt can be reversed.
    if (transaction.status !== "SUCCESS" || !transaction.mpesaTransactionId) {
      return NextResponse.json(
        { error: "Only successful payments with an M-Pesa receipt can be reversed." },
        { status: 400 }
      );
    }

    // Block duplicate/in-flight or already-reversed requests.
    if (
      transaction.reversalStatus === "PENDING" ||
      transaction.reversalStatus === "SUCCESS"
    ) {
      return NextResponse.json(
        { error: `Reversal already ${transaction.reversalStatus.toLowerCase()}.` },
        { status: 409 }
      );
    }

    // Mark pending before calling Safaricom.
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        reversalStatus: "PENDING",
        reversalRequestedAt: new Date(),
        reversalResultCode: null,
        reversalResultDesc: null,
      },
    });

    try {
      const mpesaResponse = await initiateReversal({
        transactionId: transaction.mpesaTransactionId,
        amount: Number(transaction.amount),
        remarks: `Reversal of ${transaction.mpesaTransactionId}`,
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { reversalConversationId: mpesaResponse.ConversationID },
      });

      return NextResponse.json({
        success: true,
        conversationId: mpesaResponse.ConversationID,
        message: "Reversal initiated. Awaiting confirmation from M-Pesa.",
      });
    } catch (err) {
      // Roll back to FAILED so the user can retry.
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          reversalStatus: "FAILED",
          reversalResultDesc: err instanceof Error ? err.message : "Reversal failed",
        },
      });
      throw err;
    }
  } catch (error) {
    console.error("Reversal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reversal failed" },
      { status: 500 }
    );
  }
}
