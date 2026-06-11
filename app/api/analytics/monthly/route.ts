import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ months: [] });
  try {
    const { getRevenueByMonth } = await import("@/lib/db");
    const months = await getRevenueByMonth();
    return NextResponse.json({ months });
  } catch (err) {
    return NextResponse.json({ error: String(err), months: [] });
  }
}
