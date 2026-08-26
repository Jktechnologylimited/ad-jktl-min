import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; feedbackId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { feedbackId } = await params;

  try {
    const b = await req.json();
    if (!b.status) return NextResponse.json({ error: "Status is required" }, { status: 400 });
    await sql`UPDATE project_feedback SET status = ${b.status}, updated_at = NOW() WHERE id = ${feedbackId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
