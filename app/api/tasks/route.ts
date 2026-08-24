import { NextRequest, NextResponse } from "next/server";
import { getSession, requireOwnerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ tasks: [] });
  const staffId = req.nextUrl.searchParams.get("staffId");
  const leadId = req.nextUrl.searchParams.get("leadId");
  const opportunityId = req.nextUrl.searchParams.get("opportunityId");
  let tasks;
  // Batch 03/04: lead- or opportunity-scoped follow-ups -- any authenticated
  // staff with CRM access can see tasks tied to a specific record.
  if (leadId) {
    tasks = await sql`SELECT t.*, st.name AS staff_name FROM staff_tasks t LEFT JOIN staff st ON st.id=t.staff_id WHERE t.lead_id=${leadId} ORDER BY t.created_at DESC`;
  } else if (opportunityId) {
    tasks = await sql`SELECT t.*, st.name AS staff_name FROM staff_tasks t LEFT JOIN staff st ON st.id=t.staff_id WHERE t.opportunity_id=${opportunityId} ORDER BY t.created_at DESC`;
  } else if (s.role === "owner") {
    tasks = staffId
      ? await sql`SELECT t.*, st.name AS staff_name FROM staff_tasks t LEFT JOIN staff st ON st.id=t.staff_id WHERE t.staff_id=${staffId} ORDER BY t.created_at DESC`
      : await sql`SELECT t.*, st.name AS staff_name FROM staff_tasks t LEFT JOIN staff st ON st.id=t.staff_id ORDER BY t.created_at DESC`;
  } else {
    tasks = await sql`SELECT * FROM staff_tasks WHERE staff_id=${s.staffId} ORDER BY created_at DESC`;
  }
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const b = await req.json();
    // Lead- or opportunity-scoped follow-ups: any signed-in staff with CRM
    // access can add one (defaults to themselves as assignee). Regular
    // personal staff-task creation keeps its existing owner-only rule.
    if (b.leadId || b.opportunityId) {
      if (!(b.title || "").trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      const staffId = b.staff_id || s.staffId;
      if (!staffId) return NextResponse.json({ error: "No assignee available" }, { status: 400 });
      const rows = await sql`INSERT INTO staff_tasks (staff_id, lead_id, opportunity_id, title, description, status, due_date, priority)
        VALUES (${staffId}, ${b.leadId || null}, ${b.opportunityId || null}, ${b.title.trim()}, ${b.description || ""}, ${b.status || "todo"}, ${b.due_date || null}, ${b.priority || "medium"}) RETURNING id`;
      return NextResponse.json({ ok: true, id: rows[0].id });
    }

    if (!(await requireOwnerSession())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!b.staff_id || !(b.title || "").trim()) return NextResponse.json({ error: "Staff and title are required" }, { status: 400 });
    const rows = await sql`INSERT INTO staff_tasks (staff_id, title, description, status, due_date)
      VALUES (${b.staff_id}, ${b.title.trim()}, ${b.description || ""}, ${b.status || "todo"}, ${b.due_date || null}) RETURNING id`;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}
