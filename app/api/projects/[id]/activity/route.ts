import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Fourth reuse of lead_activities (leads, opportunities, customers, now
// projects) -- see JKTL_CODEBASE_MAP.md. Powers the Notes tab (Sheet 3).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ activities: [] });
  const { id } = await params;
  const activities = await sql`
    SELECT a.*, s.name AS actor_name
    FROM lead_activities a LEFT JOIN staff s ON s.id = a.actor_staff_id
    WHERE a.project_id = ${id} ORDER BY a.created_at DESC
  `;
  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const title = (b.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO lead_activities (project_id, type, title, body, actor_staff_id)
      VALUES (${id}, ${b.type || "note"}, ${title}, ${b.body || null}, ${session.staffId || null})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
