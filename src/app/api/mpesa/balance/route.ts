import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestAccountBalance } from "@/lib/mpesa/balance";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shortcode = process.env.MPESA_SHORTCODE!;

    // Create balance snapshot record
    const snapshot = await prisma.balanceSnapshot.create({
      data: {
        shortcode,
        status: "PENDING",
      },
    });

    // Call M-Pesa Balance API
    const mpesaResponse = await requestAccountBalance();

    // Update snapshot with conversation IDs
    await prisma.balanceSnapshot.update({
      where: { id: snapshot.id },
      data: {
        conversationId: mpesaResponse.ConversationID,
        originatorConversationId: mpesaResponse.OriginatorConversationID,
      },
    });

    return NextResponse.json({
      success: true,
      snapshotId: snapshot.id,
      message: "Balance inquiry initiated",
    });
  } catch (error) {
    console.error("Balance inquiry error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Balance inquiry failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return the latest successful balance snapshot
    const latest = await prisma.balanceSnapshot.findFirst({
      where: { status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return NextResponse.json({
        utilityAccountBalance: null,
        workingAccountBalance: null,
        chargesAccountBalance: null,
        lastUpdated: null,
        status: "NO_DATA",
      });
    }

    return NextResponse.json({
      utilityAccountBalance: latest.utilityAccountBalance?.toString() ?? null,
      workingAccountBalance: latest.workingAccountBalance?.toString() ?? null,
      chargesAccountBalance: latest.chargesAccountBalance?.toString() ?? null,
      lastUpdated: latest.createdAt.toISOString(),
      status: latest.status,
    });
  } catch (error) {
    console.error("Balance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
