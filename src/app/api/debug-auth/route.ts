import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check env vars
  checks.hasAuthSecret = !!process.env.AUTH_SECRET;
  checks.hasDatabaseUrl = !!process.env.DATABASE_URL;
  checks.databaseUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) + "...";

  // Check database connection
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@lipanakash.co.ke" },
    });
    checks.userFound = !!user;
    if (user) {
      checks.userEmail = user.email;
      checks.hasHash = !!user.hashedPassword;
      checks.hashPrefix = user.hashedPassword.substring(0, 7);
      // Test password
      const match = await bcrypt.compare(
        "change-this-in-production",
        user.hashedPassword
      );
      checks.passwordMatch = match;
    }
  } catch (error) {
    checks.dbError = String(error);
  }

  return NextResponse.json(checks);
}
