import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getLead } from "@/lib/leads";

export const dynamic = "force-dynamic";

// Whitelisted, directly-editable columns. Status changes are logged as an
// activity automatically so the timeline stays accurate.
const EDITABLE_FIELDS = [
  "first_name", "last_name", "email", "phone", "business_name", "website",
  "industry", "employees", "source", "status", "next_follow_up", "owner_staff_id", "tags",
] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const before = await getLead(id);
    if (!before) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const field of EDITABLE_FIELDS) {
      if (field in b) {
        vals.push(field === "tags" ? JSON.stringify(b[field]) : b[field]);
        sets.push(`${field} = $${vals.length}`);
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });

    vals.push(id);
    await sql.query(`UPDATE service_inquiries SET ${sets.join(", ")} WHERE id = $${vals.length}`, vals);

    // Log a status-change activity automatically -- keeps the timeline honest
    // without every caller having to remember to do it.
    if ("status" in b && b.status !== before.status) {
      await sql`INSERT INTO lead_activities (lead_id, type, title, actor_staff_id)
                VALUES (${id}, 'status_change', ${`Status changed from ${before.status} to ${b.status}`}, ${session.staffId || null})`;
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
  await sql`DELETE FROM service_inquiries WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
