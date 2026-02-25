import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { BalanceCallbackResult } from "@/types/mpesa";

export async function POST(request: Request) {
  try {
    const body: BalanceCallbackResult = await request.json();
    console.log("Balance Result Callback:", JSON.stringify(body, null, 2));

    const result = body.Result;
    const conversationId = result.ConversationID;
    const resultCode = result.ResultCode;

    const snapshot = await prisma.balanceSnapshot.findUnique({
      where: { conversationId },
    });

    if (!snapshot) {
      console.warn(`BalanceSnapshot not found for ConversationID: ${conversationId}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (snapshot.status !== "PENDING") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (resultCode === 0 && result.ResultParameters) {
      const params = result.ResultParameters.ResultParameter;
      const getParam = (key: string) =>
        params.find((p) => p.Key === key)?.Value;

      // Parse the AccountBalance string
      // Format: "Account Type|Currency|Available Balance|Available Amount|Reserved Amount|Uncleared Amount"
      // Multiple accounts separated by "&"
      const balanceStr = getParam("AccountBalance")?.toString() || "";
      const balances = parseAccountBalances(balanceStr);

      await prisma.balanceSnapshot.update({
        where: { conversationId },
        data: {
          status: "SUCCESS",
          resultCode,
          resultDesc: result.ResultDesc,
          utilityAccountBalance: balances.utility,
          workingAccountBalance: balances.working,
          chargesAccountBalance: balances.charges,
        },
      });
    } else {
      await prisma.balanceSnapshot.update({
        where: { conversationId },
        data: {
          status: "FAILED",
          resultCode,
          resultDesc: result.ResultDesc,
        },
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("Balance callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

function parseAccountBalances(balanceStr: string): {
  utility: number | null;
  working: number | null;
  charges: number | null;
} {
  const result = { utility: null as number | null, working: null as number | null, charges: null as number | null };

  if (!balanceStr) return result;

  const accounts = balanceStr.split("&");

  for (const account of accounts) {
    const parts = account.split("|");
    if (parts.length < 3) continue;

    const accountType = parts[0]?.toLowerCase() || "";
    const availableBalance = parseFloat(parts[2] || "0");

    if (isNaN(availableBalance)) continue;

    if (accountType.includes("utility")) {
      result.utility = availableBalance;
    } else if (accountType.includes("working")) {
      result.working = availableBalance;
    } else if (accountType.includes("charges")) {
      result.charges = availableBalance;
    }
  }

  return result;
}
