import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateB2CPayment } from "@/lib/mpesa/b2c";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const b2cSchema = z.object({
  phoneNumber: z.string().min(9).max(13),
  amount: z.number().int().min(10).max(150000),
  commandId: z.enum(["SalaryPayment", "BusinessPayment", "PromotionPayment"]),
  remarks: z.string().max(100).optional().default("Payment"),
  occasion: z.string().max(100).optional().default(""),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = b2cSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { phoneNumber, amount, commandId, remarks, occasion } = parsed.data;
    const normalizedPhone = normalizePhone(phoneNumber);

    // Validate normalized phone number
    if (!/^254\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Must be a valid Kenyan number." },
        { status: 400 }
      );
    }

    // Rate limiting: check for duplicate payment in last 60 seconds
    const recentDuplicate = await prisma.transaction.findFirst({
      where: {
        partyB: normalizedPhone,
        amount: amount,
        createdAt: { gte: new Date(Date.now() - 60000) },
        status: "PENDING",
      },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        { error: "A similar payment is already pending. Please wait." },
        { status: 429 }
      );
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        commandId,
        amount,
        partyA: process.env.MPESA_SHORTCODE!,
        partyB: normalizedPhone,
        remarks,
        occasion,
        status: "PENDING",
        userId: session.user.id,
      },
    });

    // Call M-Pesa B2C API
    const mpesaResponse = await initiateB2CPayment({
      phoneNumber: normalizedPhone,
      amount,
      commandId,
      remarks,
      occasion,
    });

    // Update transaction with M-Pesa conversation IDs
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        conversationId: mpesaResponse.ConversationID,
        originatorConversationId: mpesaResponse.OriginatorConversationID,
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      conversationId: mpesaResponse.ConversationID,
      message: "Payment initiated successfully",
    });
  } catch (error) {
    console.error("B2C payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 }
    );
  }
}
