import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { milestoneId } = await params;

  try {
    const b = await req.json();
    const fields = ["name", "description", "start_date", "due_date", "status", "progress_pct", "sort_order"] as const;
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const f of fields) if (f in b) { vals.push(b[f]); sets.push(`${f} = $${vals.length}`); }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    vals.push(milestoneId);
    await sql.query(`UPDATE project_milestones SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { milestoneId } = await params;
  await sql`DELETE FROM project_milestones WHERE id = ${milestoneId}`;
  return NextResponse.json({ ok: true });
}
