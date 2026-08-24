import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { listOpportunities, PIPELINES, STAGES } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

// GET /api/opportunities?stage=&status=&ownerId=&from=&to=&customer=&name=&page=&pageSize=
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ opportunities: [], total: 0, page: 1, pageSize: 10 });

  const p = req.nextUrl.searchParams;
  try {
    const result = await listOpportunities({
      stage: p.get("stage") || undefined,
      status: p.get("status") || undefined,
      ownerId: p.get("ownerId") || undefined,
      from: p.get("from") || undefined,
      to: p.get("to") || undefined,
      customer: p.get("customer") || undefined,
      name: p.get("name") || undefined,
      page: Number(p.get("page")) || 1,
      pageSize: Number(p.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err), opportunities: [], total: 0 }, { status: 500 });
  }
}

// POST /api/opportunities -- direct creation (Sheet 6), independent of the lead-convert flow.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });

  try {
    const b = await req.json();
    const name = (b.name || "").trim();
    const customerName = (b.customerName || "").trim();
    if (!name) return NextResponse.json({ error: "Opportunity name is required" }, { status: 400 });
    if (!customerName) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    if (!PIPELINES.includes(b.pipeline)) return NextResponse.json({ error: "Invalid pipeline" }, { status: 400 });
    if (!STAGES.includes(b.stage)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    const rows = await sql`
      INSERT INTO opportunities
        (name, customer_name, pipeline, stage, estimated_value, expected_close_date, probability, owner_staff_id, source, description)
      VALUES
        (${name}, ${customerName}, ${b.pipeline}, ${b.stage}, ${Number(b.estimatedValue) || 0},
         ${b.expectedCloseDate || null}, ${Number(b.probability) || 50}, ${b.ownerStaffId || session.staffId || null},
         ${b.source || null}, ${b.description || null})
      RETURNING id
    `;
    const oppId = rows[0].id;
    await sql`INSERT INTO lead_activities (opportunity_id, type, title, actor_staff_id) VALUES (${oppId}, 'created', 'Opportunity created', ${session.staffId || null})`;

    return NextResponse.json({ ok: true, id: oppId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
