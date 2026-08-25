import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Team + assignment counts (Sheet 7). "Assigned Tasks" / "Tasks Completed"
// are computed live from staff_tasks, not stored -- always accurate, no
// separate counter to keep in sync.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ team: [] });
  const { id } = await params;
  const team = await sql`
    SELECT m.id, m.project_role, s.id AS staff_id, s.name, s.email,
      COUNT(t.id) AS assigned_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks
    FROM project_team_members m
    JOIN staff s ON s.id = m.staff_id
    LEFT JOIN staff_tasks t ON t.project_id = m.project_id AND t.staff_id = m.staff_id
    WHERE m.project_id = ${id}
    GROUP BY m.id, m.project_role, s.id, s.name, s.email
    ORDER BY m.created_at ASC
  `;
  return NextResponse.json({ team });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    if (!b.staffId) return NextResponse.json({ error: "Staff member is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO project_team_members (project_id, staff_id, project_role)
      VALUES (${id}, ${b.staffId}, ${b.projectRole || null})
      ON CONFLICT (project_id, staff_id) DO UPDATE SET project_role = EXCLUDED.project_role
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
