import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "No database" }, { status: 503 });

  const { action, id } = await req.json();
  const { sql } = await import("@/lib/db");

  try {
    if (action === "approve") {
      await sql`UPDATE affiliates SET status = 'active', updated_at = NOW() WHERE id = ${id}`;
    } else if (action === "reject") {
      await sql`UPDATE affiliates SET status = 'rejected', updated_at = NOW() WHERE id = ${id}`;
    } else if (action === "mark-paid") {
      await sql`UPDATE payout_requests SET status = 'paid', paid_at = NOW() WHERE id = ${id}`;
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
