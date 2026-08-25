import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getProject, getProjectProgress } from "@/lib/projects";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "name", "type", "status", "start_date", "due_date", "project_manager_staff_id",
  "description", "project_value", "paid_amount", "currency",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const progress = await getProjectProgress(id);
  return NextResponse.json({ project, progress });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const before = await getProject(id);
    if (!before) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const field of EDITABLE_FIELDS) {
      if (field in b) { vals.push(b[field]); sets.push(`${field} = $${vals.length}`); }
    }
    if ("status" in b && b.status === "completed") { vals.push(new Date().toISOString()); sets.push(`completed_at = $${vals.length}`); }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    await sql.query(`UPDATE projects SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);

    if ("status" in b && b.status !== before.status) {
      await sql`INSERT INTO lead_activities (project_id, type, title, actor_staff_id) VALUES (${id}, 'status_change', ${`Status changed from ${before.status} to ${b.status}`}, ${session.staffId || null})`;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
