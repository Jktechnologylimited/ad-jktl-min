import { NextRequest, NextResponse } from "next/server";
import { getSession, requireOwnerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ tasks: [] });
  const staffId = req.nextUrl.searchParams.get("staffId");
  let tasks;
  if (s.role === "owner") {
    tasks = staffId
      ? await sql`SELECT t.*, st.name AS staff_name FROM staff_tasks t LEFT JOIN staff st ON st.id=t.staff_id WHERE t.staff_id=${staffId} ORDER BY t.created_at DESC`
      : await sql`SELECT t.*, st.name AS staff_name FROM staff_tasks t LEFT JOIN staff st ON st.id=t.staff_id ORDER BY t.created_at DESC`;
  } else {
    tasks = await sql`SELECT * FROM staff_tasks WHERE staff_id=${s.staffId} ORDER BY created_at DESC`;
  }
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    if (!b.staff_id || !(b.title || "").trim()) return NextResponse.json({ error: "Staff and title are required" }, { status: 400 });
    const rows = await sql`INSERT INTO staff_tasks (staff_id, title, description, status, due_date)
      VALUES (${b.staff_id}, ${b.title.trim()}, ${b.description || ""}, ${b.status || "todo"}, ${b.due_date || null}) RETURNING id`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}
