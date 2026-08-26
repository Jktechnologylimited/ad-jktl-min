import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ items: [], project: null });
  const { id } = await params;
  const [items, project] = await Promise.all([
    sql`SELECT * FROM project_handover_items WHERE project_id = ${id} ORDER BY sort_order ASC, created_at ASC`,
    getProject(id),
  ]);
  return NextResponse.json({ items, project });
}

// PATCH updates the handover details (target date, handover-to, contact,
// notes, status). Checklist items are managed via the [itemId] sub-route.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const fields = ["target_handover_date", "handover_to", "client_contact", "handover_notes", "handover_status"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const f of fields) if (f in b) { vals.push(b[f]); sets.push(`${f} = $${vals.length}`); }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    await sql.query(`UPDATE projects SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    if (b.handover_status === "ready") {
      await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'status_change', 'Marked as ready for handover', ${session.staffId || null})`;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const task = (b.task || "").trim();
    if (!task) return NextResponse.json({ error: "Task is required" }, { status: 400 });
    const countRows = await sql`SELECT COUNT(*) AS n FROM project_handover_items WHERE project_id = ${id}`;
    const rows = await sql`
      INSERT INTO project_handover_items (project_id, task, sort_order)
      VALUES (${id}, ${task}, ${Number(countRows[0].n)})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
