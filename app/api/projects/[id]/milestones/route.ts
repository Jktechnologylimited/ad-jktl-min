import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ milestones: [] });
  const { id } = await params;
  const milestones = await sql`SELECT * FROM project_milestones WHERE project_id = ${id} ORDER BY sort_order ASC, created_at ASC`;
  return NextResponse.json({ milestones });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    if (!name) return NextResponse.json({ error: "Milestone name is required" }, { status: 400 });
    const countRows = await sql`SELECT COUNT(*) AS n FROM project_milestones WHERE project_id = ${id}`;
    const rows = await sql`
      INSERT INTO project_milestones (project_id, name, description, start_date, due_date, sort_order)
      VALUES (${id}, ${name}, ${b.description || null}, ${b.startDate || null}, ${b.dueDate || null}, ${Number(countRows[0].n)})
      RETURNING id
    `;
    await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'note', ${`Milestone added: ${name}`}, ${session.staffId || null})`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
