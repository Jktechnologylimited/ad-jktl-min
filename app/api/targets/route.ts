import { NextRequest, NextResponse } from "next/server";
import { getSession, requireOwnerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ targets: [] });
  const staffId = req.nextUrl.searchParams.get("staffId");
  let targets;
  if (s.role === "owner") {
    targets = staffId
      ? await sql`SELECT g.*, st.name AS staff_name FROM staff_targets g LEFT JOIN staff st ON st.id=g.staff_id WHERE g.staff_id=${staffId} ORDER BY g.created_at DESC`
      : await sql`SELECT g.*, st.name AS staff_name FROM staff_targets g LEFT JOIN staff st ON st.id=g.staff_id ORDER BY g.created_at DESC`;
  } else {
    targets = await sql`SELECT * FROM staff_targets WHERE staff_id=${s.staffId} ORDER BY created_at DESC`;
  }
  return NextResponse.json({ targets });
}

export async function POST(req: NextRequest) {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    if (!b.staff_id || !(b.label || "").trim()) return NextResponse.json({ error: "Staff and label are required" }, { status: 400 });
    const rows = await sql`INSERT INTO staff_targets (staff_id, label, metric, target_value, current_value, period)
      VALUES (${b.staff_id}, ${b.label.trim()}, ${b.metric || ""}, ${Number(b.target_value) || 0}, ${Number(b.current_value) || 0}, ${b.period || ""}) RETURNING id`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}
