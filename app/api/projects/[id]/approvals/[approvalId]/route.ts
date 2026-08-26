import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; approvalId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id, approvalId } = await params;

  try {
    const b = await req.json();
    if (!b.status) return NextResponse.json({ error: "Status is required" }, { status: 400 });
    const reviewedAt = ["approved", "rejected"].includes(b.status) ? "NOW()" : null;
    if (reviewedAt) {
      await sql`UPDATE project_approvals SET status = ${b.status}, notes = ${b.notes || null}, reviewed_at = NOW() WHERE id = ${approvalId}`;
    } else {
      await sql`UPDATE project_approvals SET status = ${b.status}, notes = ${b.notes || null} WHERE id = ${approvalId}`;
    }
    const rows = await sql`SELECT item_name FROM project_approvals WHERE id = ${approvalId} LIMIT 1`;
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'approval', ${`${rows[0]?.item_name || "Item"} ${b.status}`}, ${session.staffId || null})`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
