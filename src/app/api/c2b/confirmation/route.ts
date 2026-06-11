import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { C2BConfirmationPayload } from "@/types/mpesa";

// Safaricom POSTs here for every successful incoming payment to the paybill.
// Public endpoint (no auth) — Safaricom calls it directly.
export async function POST(request: Request) {
  try {
    const body: C2BConfirmationPayload = await request.json();
    console.log("C2B Confirmation:", JSON.stringify(body, null, 2));

    const transId = body.TransID;
    if (!transId) {
      // Nothing to record, but acknowledge so Safaricom doesn't retry.
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Idempotency: ignore duplicates (Safaricom may retry).
    const existing = await prisma.deposit.findUnique({ where: { transId } });
    if (existing) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await prisma.deposit.create({
      data: {
        transId,
        transactionType: body.TransactionType || null,
        transTime: parseTransTime(body.TransTime),
        amount: parseAmount(body.TransAmount),
        shortcode: body.BusinessShortCode || "",
        billRefNumber: body.BillRefNumber || null,
        invoiceNumber: body.InvoiceNumber || null,
        orgAccountBalance: parseDecimal(body.OrgAccountBalance),
        thirdPartyTransId: body.ThirdPartyTransID || null,
        msisdn: body.MSISDN || null,
        firstName: body.FirstName || null,
        middleName: body.MiddleName || null,
        lastName: body.LastName || null,
      },
    });

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("C2B confirmation error:", error);
    // Still acknowledge to prevent Safaricom retries.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

// "yyyyMMddHHmmss" -> Date
function parseTransTime(value: string | undefined): Date | null {
  if (!value || value.length !== 14) return null;
  const y = +value.slice(0, 4);
  const mo = +value.slice(4, 6) - 1;
  const d = +value.slice(6, 8);
  const h = +value.slice(8, 10);
  const mi = +value.slice(10, 12);
  const s = +value.slice(12, 14);
  const date = new Date(y, mo, d, h, mi, s);
  return isNaN(date.getTime()) ? null : date;
}

function parseAmount(value: string | undefined): number {
  const num = parseFloat(value ?? "");
  return isNaN(num) ? 0 : num;
}

function parseDecimal(value: string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}
