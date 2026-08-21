import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Batch 01 establishes the real contract; no notifications source exists yet
// (that lands with the modules that generate them -- CRM, Projects, Support,
// Billing etc). Returns a genuinely empty list rather than seeded/fake data.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ notifications: [], unreadCount: 0 });
}
