import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Prisma.DepositWhereInput = {};

    if (search) {
      where.OR = [
        { msisdn: { contains: search } },
        { transId: { contains: search, mode: "insensitive" } },
        { billRefNumber: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
    }

    const [deposits, total, sumResult] = await Promise.all([
      prisma.deposit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deposit.count({ where }),
      prisma.deposit.aggregate({ where, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      deposits: deposits.map((d) => ({
        id: d.id,
        createdAt: d.createdAt.toISOString(),
        transId: d.transId,
        amount: d.amount.toString(),
        msisdn: d.msisdn,
        payerName: [d.firstName, d.middleName, d.lastName]
          .filter(Boolean)
          .join(" ") || null,
        billRefNumber: d.billRefNumber,
        transactionType: d.transactionType,
        transTime: d.transTime ? d.transTime.toISOString() : null,
      })),
      totalAmount: (sumResult._sum.amount ?? 0).toString(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Deposits fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}
