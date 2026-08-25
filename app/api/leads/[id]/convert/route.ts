import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getLead } from "@/lib/leads";
import { PIPELINES, STAGES } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

// POST /api/leads/[id]/convert -- Sheet 8 of Batch 03, now fulfilled by
// Batch 04: creates a REAL row in `opportunities` (previously this only
// stored conversion_data as intent for this batch to inherit -- see
// JKTL_CODEBASE_MAP.md and the Batch 03 report). The lead keeps its
// conversion_data/converted_at as a historical record; the opportunity is
// the one now driving the actual pipeline.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sql) return NextResponse.json({ error: "No database" }, { status: 503 });
  const { id } = await params;

  try {
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const b = await req.json();
    const opportunityName = (b.opportunityName || "").trim();
    if (!opportunityName) return NextResponse.json({ error: "Opportunity name is required" }, { status: 400 });
    if (!PIPELINES.includes(b.pipeline)) return NextResponse.json({ error: "Invalid pipeline" }, { status: 400 });
    if (!STAGES.includes(b.stage)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });

    const ownerStaffId = b.ownerStaffId || lead.owner_staff_id || session.staffId || null;
    const leadName = (lead.first_name || lead.last_name) ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim() : lead.name;
    const customerName = lead.business_name || leadName || "Unnamed customer";

    const oppRows = await sql`
      INSERT INTO opportunities
        (lead_id, customer_id, name, customer_name, contact_name, contact_email, contact_phone, industry, company_size,
         pipeline, stage, estimated_value, expected_close_date, owner_staff_id, source)
      VALUES
        (${id}, ${lead.customer_id || null}, ${opportunityName}, ${customerName}, ${leadName}, ${lead.email || null}, ${lead.phone || null},
         ${lead.industry || null}, ${lead.employees || null}, ${b.pipeline}, ${b.stage},
         ${Number(b.estimatedValue) || 0}, ${b.expectedCloseDate || null}, ${ownerStaffId}, ${lead.source || null})
      RETURNING id
    `;
    const opportunityId = oppRows[0].id;

    const conversionData = {
      opportunityId, opportunityName, pipeline: b.pipeline, stage: b.stage,
      estimatedValue: Number(b.estimatedValue) || 0, expectedCloseDate: b.expectedCloseDate || null, ownerStaffId,
    };

    await sql`
      UPDATE service_inquiries
      SET status = 'converted', converted_at = NOW(), conversion_data = ${JSON.stringify(conversionData)}
      WHERE id = ${id}
    `;
    await sql`INSERT INTO lead_activities (lead_id, type, title, body, actor_staff_id) VALUES (${id}, 'status_change', 'Converted to opportunity', ${opportunityName}, ${session.staffId || null})`;
    await sql`INSERT INTO lead_activities (opportunity_id, type, title, body, actor_staff_id) VALUES (${opportunityId}, 'created', 'Created from lead', ${customerName}, ${session.staffId || null})`;

    return NextResponse.json({ ok: true, opportunityId, conversionData });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ pipelines: PIPELINES, stages: STAGES });
}
