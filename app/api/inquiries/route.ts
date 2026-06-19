import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/inquiries — all inbound enquiries (Command Centre)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ inquiries: [], counts: { new: 0, total: 0 } });
  try {
    const inquiries = await sql`SELECT * FROM service_inquiries ORDER BY created_at DESC LIMIT 500`;
    const newCount = inquiries.filter((r: Record<string, unknown>) => r.status === "new").length;
    return NextResponse.json({ inquiries, counts: { new: newCount, total: inquiries.length } });
  } catch (err) {
    return NextResponse.json({ error: String(err), inquiries: [], counts: { new: 0, total: 0 } }, { status: 500 });
  }
}
