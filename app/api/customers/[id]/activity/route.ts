import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET/POST /api/customers/[id]/activity -- Sheet 11. Same lead_activities
// table reused a third time (leads, opportunities, now customers) -- see
// JKTL_CODEBASE_MAP.md. A customer's timeline naturally aggregates its own
// direct activity plus activity from its linked opportunities/proposals,
// which is what makes "Activity Timeline" genuinely useful rather than an
// empty log for a brand-new customer record.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ activities: [] });
  const { id } = await params;

  try {
    const activities = await sql`
      SELECT a.id, a.type, a.title, a.body, a.created_at, s.name AS actor_name
      FROM lead_activities a
      LEFT JOIN staff s ON s.id = a.actor_staff_id
      WHERE a.customer_id = ${id}
         OR a.opportunity_id IN (SELECT id FROM opportunities WHERE customer_id = ${id})
         OR a.lead_id IN (SELECT id FROM service_inquiries WHERE customer_id = ${id})
      ORDER BY a.created_at DESC LIMIT 100
    `;
    return NextResponse.json({ activities });
  } catch (err) {
    return NextResponse.json({ activities: [], error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const b = await req.json();
    const title = (b.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    const rows = await sql`
      INSERT INTO lead_activities (customer_id, type, title, body, actor_staff_id)
      VALUES (${id}, ${b.type || "note"}, ${title}, ${b.body || null}, ${session.staffId || null})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
