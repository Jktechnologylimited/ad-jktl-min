import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ approvals: [] });
  const { id } = await params;
  const approvals = await sql`
    SELECT a.*, s.name AS submitted_by_name
    FROM project_approvals a LEFT JOIN staff s ON s.id = a.submitted_by_staff_id
    WHERE a.project_id = ${id} ORDER BY a.submitted_at DESC
  `;
  return NextResponse.json({ approvals });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const itemName = (b.itemName || "").trim();
    if (!itemName) return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO project_approvals (project_id, item_name, type, submitted_by_staff_id)
      VALUES (${id}, ${itemName}, ${b.type || "design"}, ${session.staffId || null})
      RETURNING id
    `;
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'approval', ${`${itemName} submitted for approval`}, ${session.staffId || null})`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
