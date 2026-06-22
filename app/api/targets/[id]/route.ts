import { NextRequest, NextResponse } from "next/server";
import { getSession, requireOwnerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const b = await req.json();
  if (s.role !== "owner") {
    const own = await sql`SELECT id FROM staff_targets WHERE id=${id} AND staff_id=${s.staffId} LIMIT 1`;
    if (!own.length) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await sql`UPDATE staff_targets SET current_value=${Number(b.current_value) || 0} WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  }
  await sql`UPDATE staff_targets SET label=${b.label}, metric=${b.metric || ""},
      target_value=${Number(b.target_value) || 0}, current_value=${Number(b.current_value) || 0}, period=${b.period || ""} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  await sql`DELETE FROM staff_targets WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
